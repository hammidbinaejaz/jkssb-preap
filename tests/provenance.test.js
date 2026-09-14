#!/usr/bin/env node
/**
 * Provenance, mock progress, and mistake-review contract.
 * node tests/provenance.test.js
 */

const fs = require('fs');
const path = require('path');
const {
  isExamReadyQuestion,
  getMockQuestions,
  getPracticeQuestions,
  provenanceMeta,
  DataStore,
  normalizeQuestion,
} = require('../js/data.js');
const {
  mistakeReviewModel,
  faaWeekPlan,
  scoreTest,
} = require('../js/utils.js');
const {
  recordMockProgress,
  loadProgress,
  _bindStorage,
} = require('../js/storage.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

function sample(status) {
  return normalizeQuestion({
    question_id: 'faa-gk-001',
    question: 'Summer capital of J&K UT?',
    options: [
      { id: 'A', text: 'Srinagar' },
      { id: 'B', text: 'Jammu' },
      { id: 'C', text: 'Leh' },
      { id: 'D', text: 'Katra' },
    ],
    correct_option: 'A',
    subject: 'General Knowledge with special reference to J&K UT',
    topic: 'J&K UT',
    explanation: 'Srinagar is the summer capital; Jammu is the winter capital under the Darbar Move.',
    verification_status: status,
    source: 'Generated syllabus drill (not an official JKSSB key)',
  }, { post_id: 'accounts-assistant-finance' });
}

function runTests() {
  let passed = 0;
  function test(name, fn) {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('provenance.test.js\n');

  test('generated is exam-ready; verified is not', () => {
    assert(isExamReadyQuestion(sample('generated')));
    assert(isExamReadyQuestion(sample('human_reviewed')));
    assert(isExamReadyQuestion(sample('official_pyq')));
    assert(!isExamReadyQuestion(sample('verified')));
    assert(!isExamReadyQuestion(sample('needs_review')));
    assert(!isExamReadyQuestion(sample('invalid')));
  });

  test('practice and mocks use generated items without calling them verified', () => {
    const q = sample('generated');
    DataStore.datasets = { 'accounts-assistant-finance': { questions: [q] } };
    const practice = getPracticeQuestions({ postId: 'accounts-assistant-finance', count: 5 });
    assertEqual(practice.length, 1);
    assertEqual(practice[0].verification_status, 'generated');
    const mock = getMockQuestions(10, { dataset_id: 'accounts-assistant-finance', sections: [] });
    assertEqual(mock.length, 1);
    assertEqual(provenanceMeta('generated').label, 'Generated syllabus drill');
  });

  test('mistake review model includes explanation and option text', () => {
    const q = sample('generated');
    const view = mistakeReviewModel({ question: q, selected: 'B', correct: 'A' });
    assert(view.explanation.length > 20);
    assert(view.selectedLabel.includes('Jammu'));
    assert(view.correctLabel.includes('Srinagar'));
  });

  test('recordMockProgress writes attempts and topic stats', () => {
    _bindStorage(new MockLocalStorage());
    const q = sample('generated');
    const questionsById = new Map([[q.question_id, q]]);
    const scored = scoreTest({
      questionIds: [q.question_id],
      answers: { [q.question_id]: 'B' },
      questionsById,
      examConfig: { marks_per_question: 1, negative_marking: 0.25 },
    });
    recordMockProgress({
      questionIds: [q.question_id],
      answers: { [q.question_id]: 'B' },
      ...scored,
    }, questionsById);
    const progress = loadProgress();
    assertEqual(progress.attempts.length, 1);
    assertEqual(progress.attempts[0].mode, 'mock');
    assertEqual(progress.topicStats['J&K UT'].total, 1);
    assertEqual(progress.topicStats['J&K UT'].correct, 0);
  });

  test('weekly plan is FAA-only', () => {
    const plan = faaWeekPlan([]);
    const blob = plan.map((p) => p.text).join(' ').toLowerCase();
    assert(!blob.includes('reasoning'));
    assert(!blob.includes('typing'));
    assert(!blob.includes('steno'));
    assert(blob.includes('accountancy'));
  });

  test('README states the live bank size', () => {
    const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
    const index = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'index.json'), 'utf8'));
    const n = index.datasets[0].question_count;
    assert(readme.includes(String(n)), `README should mention ${n}`);
    assert(!/100 MCQs/.test(readme));
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
