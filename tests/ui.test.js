#!/usr/bin/env node
/**
 * Option-button selection — node tests/ui.test.js
 */

const { isChosenOption } = require('../js/ui.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function runTests() {
  let passed = 0;
  function test(name, fn) {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('ui.test.js\n');

  test('only the clicked option is treated as selected', () => {
    assert(isChosenOption('B', 'B'));
    assert(!isChosenOption('A', 'B'));
    assert(!isChosenOption('C', 'B'));
    assert(!isChosenOption('D', 'B'));
  });

  test('no option is selected before an answer is stored', () => {
    assert(!isChosenOption('A', undefined));
    assert(!isChosenOption('A', null));
    assert(!isChosenOption('A', ''));
  });

  test('blank option ids never look selected together', () => {
    assert(!isChosenOption('', ''));
    assert(!isChosenOption('', 'A'));
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
