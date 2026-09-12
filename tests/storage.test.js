#!/usr/bin/env node
/**
 * Storage module tests — run with: node tests/storage.test.js
 */

const {
  safeParse,
  saveProgress,
  loadProgress,
  saveBookmark,
  loadBookmarks,
  removeBookmark,
  toggleBookmark,
  saveTest,
  loadTest,
  clearActiveTest,
  saveTestResult,
  loadTestHistory,
  saveSelectedPost,
  loadSelectedPost,
  clearSelectedPostStorage,
  _bindStorage,
} = require('../js/storage.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
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
    const storage = new MockLocalStorage();
    _bindStorage(storage);
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }

  console.log('storage.test.js\n');

  test('safeParse returns fallback on invalid JSON', () => {
    assertEqual(safeParse('{bad', 'fb'), 'fb');
    assert(Array.isArray(safeParse(null, [])));
  });

  test('saveProgress / loadProgress roundtrip', () => {
    const data = { attempts: [{ questionId: 'FIN-001' }], topicStats: {}, lastActivity: 1 };
    saveProgress(data);
    const loaded = loadProgress();
    assertEqual(loaded.attempts.length, 1);
    assertEqual(loaded.attempts[0].questionId, 'FIN-001');
  });

  test('bookmark add, toggle, remove', () => {
    saveBookmark('FIN-001');
    assert(loadBookmarks().includes('FIN-001'));
    assert(toggleBookmark('FIN-001') === false);
    assertEqual(loadBookmarks().length, 0);
    assert(toggleBookmark('FIN-002') === true);
    removeBookmark('FIN-002');
    assertEqual(loadBookmarks().length, 0);
  });

  test('active test save, load, clear', () => {
    const testState = { id: 't1', questionIds: ['FIN-001'], answers: {} };
    saveTest(testState);
    assertEqual(loadTest().id, 't1');
    clearActiveTest();
    assertEqual(loadTest(), null);
  });

  test('test history persists results', () => {
    saveTestResult({ id: 'r1', score: 20, maxScore: 30 });
    const history = loadTestHistory();
    assertEqual(history[0].id, 'r1');
    assertEqual(history[0].score, 20);
  });

  test('selected post save, load, clear', () => {
    saveSelectedPost('junior-assistant', { categoryId: 'clerical', name: 'Junior Assistant' });
    const selected = loadSelectedPost();
    assertEqual(selected.postId, 'junior-assistant');
    assertEqual(selected.categoryId, 'clerical');
    clearSelectedPostStorage();
    assertEqual(loadSelectedPost(), null);
  });

  console.log(`\n${passed} passed`);
}

try {
  runTests();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
