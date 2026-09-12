#!/usr/bin/env node
/**
 * Data normalization tests — run with: node tests/data.test.js
 */

const { normalizeQuestion } = require('../js/data.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function runTests() {
  let passed = 0;
  function test(name, fn) {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('data.test.js\n');

  test('normalizeQuestion maps flat option_a..d and correct', () => {
    const q = normalizeQuestion({
      question_id: 'JA-001',
      question: 'What is the capital of J&K?',
      option_a: 'Srinagar',
      option_b: 'Jammu',
      option_c: 'Leh',
      option_d: 'Anantnag',
      correct: 'a',
      subject: 'J&K GK',
      topic: 'Geography',
      year: '2022',
      source: 'JKSSB',
      verification_status: 'verified',
    }, { post_id: 'junior-assistant', post_name: 'Junior Assistant', category: 'Clerical' });

    assertEqual(q.question_id, 'junior-assistant-001');
    assertEqual(q.options.length, 4);
    assertEqual(q.options[0].id, 'A');
    assertEqual(q.options[0].text, 'Srinagar');
    assertEqual(q.correct_option, 'A');
    assertEqual(q.source.label, 'JKSSB');
    assertEqual(q.post_id, 'junior-assistant');
    assertEqual(q.category, 'Clerical');
  });

  test('normalizeQuestion keeps already-scoped IDs', () => {
    const q = normalizeQuestion({
      question_id: 'junior-assistant-042',
      question: 'Scoped id stays.',
      options: [
        { id: 'A', text: 'One' },
        { id: 'B', text: 'Two' },
        { id: 'C', text: 'Three' },
        { id: 'D', text: 'Four' },
      ],
      correct_option: 'A',
      verification_status: 'verified',
    }, { post_id: 'junior-assistant' });
    assertEqual(q.question_id, 'junior-assistant-042');
  });

  test('normalizeQuestion keeps legacy options + correct_option', () => {
    const q = normalizeQuestion({
      question_id: 'FIN-001',
      question: 'Legacy shaped question text here.',
      options: [
        { id: 'A', text: 'One' },
        { id: 'B', text: 'Two' },
      ],
      correct_option: 'B',
      verification_status: 'verified',
    });
    assertEqual(q.correct_option, 'B');
    assertEqual(q.options[1].text, 'Two');
  });

  test('normalizeQuestion returns null for invalid input', () => {
    assertEqual(normalizeQuestion(null), null);
    assertEqual(normalizeQuestion(undefined), null);
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
