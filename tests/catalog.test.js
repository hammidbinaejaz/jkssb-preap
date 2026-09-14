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
  });

  test('only the FAA qbank file exists under data/qbanks', () => {
    const root = path.join(__dirname, '..', 'data', 'qbanks');
    const files = [];
    function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.json')) files.push(path.relative(root, full));
      });
    }
    walk(root);
    assertEqual(files.length, 1);
    assertEqual(files[0], path.join('finance', 'accounts-assistant-finance.json'));
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
