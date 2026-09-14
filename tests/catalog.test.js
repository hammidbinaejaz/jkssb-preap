#!/usr/bin/env node
/**
 * FAA-only catalog contract — run with: node tests/catalog.test.js
 */

const fs = require('fs');
const path = require('path');

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

  console.log('catalog.test.js\n');

  test('catalog contains only Accounts Assistant (Finance)', () => {
    const catalog = readJson('data/catalog.json');
    const posts = (catalog.categories || []).flatMap((c) => c.posts || []);
    assertEqual(posts.length, 1);
    assertEqual(posts[0].id, 'accounts-assistant-finance');
    assertEqual(catalog.categories.length, 1);
    assertEqual(catalog.categories[0].id, 'finance');
  });

  test('exams.json contains only the FAA paper', () => {
    const exams = readJson('data/exams.json');
    assertEqual(exams.exams.length, 1);
    assertEqual(exams.exams[0].id, 'accounts-assistant-finance');
  });

  test('index.json lists only the FAA dataset', () => {
    const index = readJson('data/index.json');
    assertEqual(index.datasets.length, 1);
    assertEqual(index.datasets[0].id, 'accounts-assistant-finance');
    assertEqual(index.datasets[0].question_count, 4100);
  });

  test('FAA subject banks exist with 500 MCQs each', () => {
    const exam = readJson('data/exams.json').exams[0];
    exam.sections.forEach((section) => {
      const bank = readJson(`data/${section.file}`);
      assertEqual(bank.questions.length, 500, section.id);
      assertEqual(bank.subject, section.name);
      const stems = new Set(bank.questions.map((q) => q.question));
      assertEqual(stems.size, 500, `${section.id} unique stems`);
    });
    const pattern = readJson('data/qbanks/finance/faa/latest-pattern.json');
    assertEqual(pattern.questions.length, 100);
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
