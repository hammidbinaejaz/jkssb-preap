#!/usr/bin/env node
/**
 * Site password gate — run with: node tests/gate.test.js
 */

const fs = require('fs');
const path = require('path');

const {
  SITE_GATE_HASH,
  SITE_GATE_STORAGE_KEY,
  hashSitePassword,
  isSiteUnlocked,
  tryUnlockSite,
  clearSiteUnlock,
} = require('../js/gate.js');

function htmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      files.push(...htmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
}

function runTests() {
  let passed = 0;

  function test(name, fn) {
    return Promise.resolve(fn()).then(() => {
      passed += 1;
      console.log(`  ✓ ${name}`);
    });
  }

  console.log('gate.test.js\n');

  const previous = globalThis.localStorage;
  globalThis.localStorage = new MockLocalStorage();

  return Promise.resolve()
    .then(() => test('hashes the shared access code to a fixed SHA-256', async () => {
      const hash = await hashSitePassword('0987654321');
      assertEqual(hash, '17756315ebd47b7110359fc7b168179bf6f2df3646fcc888bc8aa05c78b38ac1');
      assertEqual(SITE_GATE_HASH, hash);
    }))
    .then(() => test('rejects a different password hash', async () => {
      const hash = await hashSitePassword('1234');
      assert(hash !== SITE_GATE_HASH, 'wrong password must not match the gate hash');
    }))
    .then(() => test('is locked until a correct unlock is stored', async () => {
      clearSiteUnlock();
      assertEqual(isSiteUnlocked(), false);
      assertEqual(await tryUnlockSite('nope'), false);
      assertEqual(isSiteUnlocked(), false);
    }))
    .then(() => test('unlocks this browser after the correct password', async () => {
      assertEqual(await tryUnlockSite('0987654321'), true);
      assertEqual(isSiteUnlocked(), true);
      assertEqual(globalThis.localStorage.getItem(SITE_GATE_STORAGE_KEY), SITE_GATE_HASH);
    }))
    .then(() => test('clearSiteUnlock locks the browser again', () => {
      clearSiteUnlock();
      assertEqual(isSiteUnlocked(), false);
    }))
    .then(() => test('every HTML page loads the gate before body content', () => {
      const root = path.join(__dirname, '..');
      const pages = htmlFiles(root);
      assert(pages.length >= 10, 'expected site HTML pages');
      pages.forEach((file) => {
        const html = fs.readFileSync(file, 'utf8');
        assert(/js\/gate\.js/.test(html), `${path.relative(root, file)} must load gate.js`);
      });
    }))
    .then(() => test('service worker caches the gate script', () => {
      const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
      assert(/jkssb-prep-v9/.test(sw), 'cache name must bump so old pages are dropped');
      assert(/\.\/js\/gate\.js/.test(sw), 'offline cache must include gate.js');
      assert(/isPage/.test(sw), 'HTML navigations must prefer the network');
    }))
    .then(() => {
      globalThis.localStorage = previous;
      console.log(`\n${passed} passed`);
    })
    .catch((err) => {
      globalThis.localStorage = previous;
      throw err;
    });
}

runTests().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
