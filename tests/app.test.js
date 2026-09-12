#!/usr/bin/env node
/**
 * Path helpers — run with: node tests/app.test.js
 */

const { rootPagesPath, pagesHref, resolveAppHref, getBasePath } = require('../js/app.js');

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

  console.log('app.test.js\n');

  test('rootPagesPath is storage-safe', () => {
    assertEqual(rootPagesPath('practice.html', { topic: 'GA' }), 'pages/practice.html?topic=GA');
    assertEqual(rootPagesPath('pages/mock.html'), 'pages/mock.html');
  });

  test('resolveAppHref normalizes legacy continue URLs at site root', () => {
    global.window = { location: { pathname: '/jkssb-preap/index.html' } };
    assertEqual(getBasePath(), './');
    assertEqual(resolveAppHref('../pages/practice.html?q=1'), './pages/practice.html?q=1');
    assertEqual(resolveAppHref('pages/results.html?id=abc'), './pages/results.html?id=abc');
  });

  test('resolveAppHref works from pages/', () => {
    global.window = { location: { pathname: '/jkssb-preap/pages/practice.html' } };
    assertEqual(getBasePath(), '../');
    assertEqual(resolveAppHref('pages/mock.html'), '../pages/mock.html');
    assertEqual(pagesHref('browse.html'), '../pages/browse.html');
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
