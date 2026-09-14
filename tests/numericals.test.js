#!/usr/bin/env node
/**
 * Computed numerical drill — node tests/numericals.test.js
 */

const { NumericalDrill } = require('../js/numericals.js');

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

  console.log('numericals.test.js\n');

  test('simple interest key matches PRT/100', () => {
    const q = NumericalDrill.math(0);
    const match = q.question.match(/₹(\d+) at (\d+)% p\.a\. for (\d+) years/);
    assert(match, 'stem must include P, R, T');
    const expected = (Number(match[1]) * Number(match[2]) * Number(match[3])) / 100;
    const keyed = q.options.find((o) => o.id === q.correct_option);
    assertEqual(Number(keyed.text), expected);
  });

  test('accounting equation key matches A − L', () => {
    const q = NumericalDrill.accounts(0);
    const match = q.question.match(/Assets ₹(\d+), liabilities ₹(\d+)/);
    assert(match);
    const expected = Number(match[1]) - Number(match[2]);
    const keyed = q.options.find((o) => o.id === q.correct_option);
    assertEqual(Number(keyed.text), expected);
  });

  test('generates unique stems with valid A–D keys', () => {
    const qs = NumericalDrill.generate('Mathematics', 200);
    assertEqual(qs.length, 200);
    const stems = new Set(qs.map((q) => q.question));
    assertEqual(stems.size, 200);
    qs.forEach((q) => {
      assertEqual(q.options.length, 4);
      assertEqual(q.options.map((o) => o.id).join(''), 'ABCD');
      const texts = q.options.map((o) => o.text);
      assertEqual(new Set(texts).size, 4, `duplicate options: ${q.question}`);
      assert(q.options.some((o) => o.id === q.correct_option));
      assertEqual(q.verification_status, 'generated');
    });
  });

  test('generateMix covers all three numerical subjects', () => {
    const qs = NumericalDrill.generateMix(12);
    const subjects = new Set(qs.map((q) => q.subject));
    assert(subjects.has('Mathematics'));
    assert(subjects.has('Statistics'));
    assert(subjects.has('Accountancy and Book Keeping'));
  });

  test('can produce a large unique numerical set', () => {
    const qs = NumericalDrill.generateMix(1000);
    assertEqual(qs.length, 1000);
    assertEqual(new Set(qs.map((q) => q.question_id)).size, 1000);
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
