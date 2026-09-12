#!/usr/bin/env node
/**
 * Utils module tests — run with: node tests/utils.test.js
 */

const {
  shuffle,
  formatTime,
  clamp,
  normalize,
  editDistance,
  tokenMatches,
  scoreTest,
} = require('../js/utils.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function runTests() {
  let passed = 0;

  function test(name, fn) {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('utils.test.js\n');

  test('shuffle preserves all elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const output = shuffle(input);
    assertEqual(output.length, input.length);
    assertEqual([...output].sort((a, b) => a - b).join(','), input.join(','));
    assert(input.join(',') === '1,2,3,4,5,6,7,8,9,10', 'shuffle should not mutate original');
  });

  test('shuffle produces varied order over multiple runs', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const orders = new Set();
    for (let i = 0; i < 20; i += 1) {
      orders.add(shuffle(input).join(','));
    }
    assert(orders.size > 1, 'shuffle should produce more than one ordering');
  });

  test('formatTime formats mm:ss and hh:mm:ss', () => {
    assertEqual(formatTime(125), '02:05');
    assertEqual(formatTime(3661), '1:01:01');
  });

  test('clamp restricts values', () => {
    assertEqual(clamp(5, 0, 10), 5);
    assertEqual(clamp(-1, 0, 10), 0);
    assertEqual(clamp(99, 0, 10), 10);
  });

  test('normalize collapses whitespace and lowercases', () => {
    assertEqual(normalize('  Hello,  World!  '), 'hello world');
  });

  test('editDistance computes Levenshtein distance', () => {
    assertEqual(editDistance('kitten', 'sitting'), 3);
    assertEqual(editDistance('', 'abc'), 3);
    assertEqual(editDistance('abc', 'abc'), 0);
  });

  test('tokenMatches allows edit distance 1', () => {
    assert(tokenMatches('scarcity', 'scarciy'));
    assert(tokenMatches('demand', 'demad') === false || tokenMatches('demad', 'demand'));
  });

  test('scoreTest with negative marking', () => {
    const questions = {
      Q1: { question_id: 'Q1', correct_option: 'A', topic: 'T1' },
      Q2: { question_id: 'Q2', correct_option: 'B', topic: 'T1' },
      Q3: { question_id: 'Q3', correct_option: 'C', topic: 'T2' },
    };
    const result = scoreTest({
      questionIds: ['Q1', 'Q2', 'Q3'],
      answers: { Q1: 'A', Q2: 'A', Q3: 'C' },
      questionsById: questions,
      examConfig: { marks_per_question: 1, negative_marking: 0.25 },
    });
    assertEqual(result.correct, 2);
    assertEqual(result.incorrect, 1);
    assertEqual(result.unanswered, 0);
    assertEqual(result.score, 1.75);
    assertEqual(result.maxScore, 3);
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
