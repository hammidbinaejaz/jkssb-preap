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

  test('index.json question_count matches the FAA banks', () => {
    const index = readJson('data/index.json');
    const catalog = readJson('data/catalog.json');
    const manifest = readJson('data/qbanks/finance/accounts-assistant-finance.json');
    const exam = readJson('data/exams.json').exams[0];
    let total = 0;
    exam.sections.forEach((section) => {
      total += readJson(`data/${section.file}`).questions.length;
    });
    total += readJson('data/qbanks/finance/faa/latest-pattern.json').questions.length;
    assertEqual(index.datasets.length, 1);
    assertEqual(index.datasets[0].id, 'accounts-assistant-finance');
    assert(index.datasets[0].question_count >= 4000, 'FAA bank should stay large after quality cleanup');
    assertEqual(index.datasets[0].question_count, total);
    assertEqual(catalog.categories[0].posts[0].question_count, total);
    assertEqual(manifest.question_count, total);
  });

  test('FAA subject banks have unique stems, provenance, and real explanations', () => {
    const exam = readJson('data/exams.json').exams[0];
    exam.sections.forEach((section) => {
      const bank = readJson(`data/${section.file}`);
      assert(bank.questions.length >= 200, `${section.id} count ${bank.questions.length}`);
      assertEqual(bank.subject, section.name);
      const stems = new Set(bank.questions.map((q) => q.question));
      assertEqual(stems.size, bank.questions.length, `${section.id} unique stems`);
      const ids = new Set(bank.questions.map((q) => q.question_id));
      assertEqual(ids.size, bank.questions.length, `${section.id} unique ids`);
      bank.questions.forEach((q) => {
        assert(!/\(item\s+\d+\)/i.test(q.question), q.question_id);
        assert(q.verification_status !== 'verified', q.question_id);
        const words = String(q.explanation || '').match(/[A-Za-z0-9']+/g) || [];
        assert(words.length >= 20, `${q.question_id} explanation`);
      });
    });
    const pattern = readJson('data/qbanks/finance/faa/latest-pattern.json');
    assertEqual(pattern.questions.length, 100);
    pattern.questions.forEach((q) => {
      assert(q.verification_status === 'generated', q.question_id);
      assert(!/syllabus notes/i.test(q.explanation || ''), q.question_id);
    });
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
