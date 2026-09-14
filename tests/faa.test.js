#!/usr/bin/env node
/**
 * Official FAA pattern contract — node tests/faa.test.js
 */

const fs = require('fs');
const path = require('path');
const { getMockQuestions, getPracticeQuestions, DataStore, normalizeQuestion } = require('../js/data.js');
const { shuffle } = require('../js/utils.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));
}

function runTests() {
  let passed = 0;
  function test(name, fn) {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('faa.test.js\n');

  test('official 2025 paper is 120 marks with 0.25 negative marking', () => {
    const exams = readJson('data/exams.json');
    const exam = exams.exams[0];
    assertEqual(exam.id, 'accounts-assistant-finance');
    assertEqual(exam.duration_minutes, 120);
    assertEqual(exam.default_question_count, 120);
    assertEqual(exam.negative_marking, 0.25);
    assertEqual(exam.marks_per_question, 1);
    const marks = exam.sections.reduce((n, s) => n + (s.marks || 0), 0);
    assertEqual(marks, 120);
    assertEqual(exam.sections.length, 8);
  });

  test('eight official subjects are present including General Economics', () => {
    const exam = readJson('data/exams.json').exams[0];
    const ids = exam.sections.map((s) => s.id);
    [
      'gk-jk',
      'accountancy',
      'english',
      'statistics',
      'mathematics',
      'economics',
      'science',
      'computers',
    ].forEach((id) => assert(ids.includes(id), `missing section ${id}`));
  });

  test('getMockQuestions builds official section mix when pattern is official', () => {
    const exam = readJson('data/exams.json').exams[0];
    const questions = [];
    exam.sections.forEach((section) => {
      for (let i = 0; i < 40; i += 1) {
        questions.push(normalizeQuestion({
          question_id: `${section.id}-${String(i + 1).padStart(3, '0')}`,
          question: `${section.id} item ${i + 1}?`,
          options: [
            { id: 'A', text: 'A1' },
            { id: 'B', text: 'B1' },
            { id: 'C', text: 'C1' },
            { id: 'D', text: 'D1' },
          ],
          correct_option: 'A',
          subject: section.name,
          verification_status: 'generated',
        }, { post_id: 'accounts-assistant-finance' }));
      }
    });
    DataStore.datasets = {
      'accounts-assistant-finance': { questions },
    };
    DataStore.postsById = new Map([
      ['accounts-assistant-finance', { id: 'accounts-assistant-finance', name: 'FAA' }],
    ]);
    const paper = getMockQuestions(120, {
      ...exam,
      dataset_id: 'accounts-assistant-finance',
    }, { official: true });
    assertEqual(paper.length, 120);
    exam.sections.forEach((section) => {
      const n = paper.filter((q) => q.subject === section.name).length;
      assertEqual(n, section.question_count || section.marks, `${section.id} count`);
    });
  });

  test('shuffle is non-destructive', () => {
    const a = [1, 2, 3];
    shuffle(a);
    assertEqual(a.length, 3);
  });

  test('full-mix practice excludes the retained latest-pattern pack', () => {
    DataStore.datasets = {
      'accounts-assistant-finance': {
        questions: [
          normalizeQuestion({
            question_id: 'faa-math-001',
            question: '2 + 2?',
            options: [
              { id: 'A', text: '4' },
              { id: 'B', text: '3' },
              { id: 'C', text: '2' },
              { id: 'D', text: '1' },
            ],
            correct_option: 'A',
            subject: 'Mathematics',
            verification_status: 'generated',
          }, { post_id: 'accounts-assistant-finance' }),
          normalizeQuestion({
            question_id: 'accounts-assistant-finance-001',
            question: 'Latest pattern item?',
            options: [
              { id: 'A', text: '4' },
              { id: 'B', text: '3' },
              { id: 'C', text: '2' },
              { id: 'D', text: '1' },
            ],
            correct_option: 'A',
            subject: 'Latest pattern paper',
            verification_status: 'generated',
          }, { post_id: 'accounts-assistant-finance' }),
        ],
      },
    };
    const mix = getPracticeQuestions({
      postId: 'accounts-assistant-finance',
      count: 10,
    });
    assertEqual(mix.length, 1);
    assertEqual(mix[0].subject, 'Mathematics');
    const pack = getPracticeQuestions({
      postId: 'accounts-assistant-finance',
      subject: 'Latest pattern paper',
      count: 10,
    });
    assertEqual(pack.length, 1);
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
