#!/usr/bin/env node
/**
 * Product hardening tests — run with: node tests/product.test.js
 */

const {
  normalizeQuestion,
  getExamConfigForPost,
  DataStore,
} = require('../js/data.js');
const {
  scoreTest,
  detectTextLang,
  formatTime,
} = require('../js/utils.js');
const {
  exportUserData,
  importUserData,
  getPracticeStreak,
  getWeakTopicQueue,
  saveProgress,
  loadProgress,
  recordAttempt,
  setContinuePreparation,
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

function runTests() {
  let passed = 0;
  function test(name, fn) {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('product.test.js\n');

  test('normalizeQuestion preserves post-scoped IDs and pool_type', () => {
    const q = normalizeQuestion({
      question_id: 'junior-assistant-001',
      question: 'Sample?',
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '4' },
      ],
      correct_option: 'B',
      verification_status: 'verified',
      pool_type: 'shared_syllabus_pool',
      explanation: 'Because B.',
    }, { post_id: 'junior-assistant', post_name: 'Junior Assistant', category: 'Clerical' });
    assertEqual(q.question_id, 'junior-assistant-001');
    assertEqual(q.pool_type, 'shared_syllabus_pool');
    assertEqual(q.explanation, 'Because B.');
    assertEqual(q.post_id, 'junior-assistant');
  });

  test('scoreTest applies 0.25 negative marking', () => {
    const questionsById = {
      'junior-assistant-001': { correct_option: 'A', topic: 'GA' },
      'junior-assistant-002': { correct_option: 'B', topic: 'GA' },
      'junior-assistant-003': { correct_option: 'C', topic: 'Reasoning' },
    };
    const result = scoreTest({
      questionIds: Object.keys(questionsById),
      answers: {
        'junior-assistant-001': 'A',
        'junior-assistant-002': 'A',
        'junior-assistant-003': null,
      },
      questionsById,
      examConfig: { marks_per_question: 1, negative_marking: 0.25 },
    });
    assertEqual(result.correct, 1);
    assertEqual(result.incorrect, 1);
    assertEqual(result.unanswered, 1);
    assertEqual(result.score, 0.75);
    assertEqual(result.maxScore, 3);
  });

  test('detectTextLang flags Urdu script', () => {
    assertEqual(detectTextLang('صبح بخیر'), 'ur');
    assertEqual(detectTextLang('Good morning'), 'en');
  });

  test('formatTime pads minutes', () => {
    assertEqual(formatTime(65), '01:05');
  });

  test('export/import progress round-trips', () => {
    _bindStorage(new MockLocalStorage());
    saveProgress({ attempts: [{ questionId: 'x', correct: true, at: Date.now() }], topicStats: {} });
    const blob = exportUserData();
    _bindStorage(new MockLocalStorage());
    const ok = importUserData(blob);
    assert(ok);
    assertEqual(loadProgress().attempts.length, 1);
  });

  test('practice streak counts consecutive days', () => {
    _bindStorage(new MockLocalStorage());
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    saveProgress({
      attempts: [
        { questionId: 'a', correct: true, timestamp: now },
        { questionId: 'b', correct: false, timestamp: now - day },
        { questionId: 'c', correct: true, timestamp: now - 2 * day },
      ],
      topicStats: {},
    });
    assertEqual(getPracticeStreak(loadProgress()), 3);
  });

  test('weak topic queue prefers low accuracy', () => {
    _bindStorage(new MockLocalStorage());
    saveProgress({
      attempts: [],
      topicStats: {
        Strong: { correct: 9, total: 10 },
        Weak: { correct: 1, total: 5 },
      },
    });
    const queue = getWeakTopicQueue(loadProgress());
    assertEqual(queue[0].topic, 'Weak');
  });

  test('getExamConfigForPost falls back safely without catalog', () => {
    DataStore.catalog = null;
    DataStore.exams = { exams: [] };
    DataStore.postsById = new Map();
    DataStore.datasets = {};
    const exam = getExamConfigForPost('missing-post');
    assertEqual(exam.negative_marking, 0);
    assert(exam.duration_minutes >= 0);
  });

  test('setContinuePreparation stores root-stable paths', () => {
    _bindStorage(new MockLocalStorage());
    setContinuePreparation('../pages/practice.html?topic=GA', 'Drill GA');
    assertEqual(loadProgress().continueUrl, 'pages/practice.html?topic=GA');
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
