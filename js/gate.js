/**
 * Casual visitor gate for GitHub Pages.
 * Stops people who only have the link; not a server-side login.
 */

const SITE_GATE_STORAGE_KEY = 'jkssb_site_unlocked';
const SITE_GATE_HASH = '17756315ebd47b7110359fc7b168179bf6f2df3646fcc888bc8aa05c78b38ac1';

function getGateStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    /* private mode / blocked */
  }
  return null;
}

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * SHA-256 hex digest of a password.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashSitePassword(password) {
  const text = String(password ?? '');
  const subtle = typeof globalThis !== 'undefined' ? globalThis.crypto?.subtle : null;
  if (subtle) {
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(text));
    return toHex(new Uint8Array(buf));
  }
  try {
    if (typeof require === 'function') {
      return require('crypto').createHash('sha256').update(text, 'utf8').digest('hex');
    }
  } catch {
    /* browser without require */
  }
  throw new Error('Password hashing is unavailable');
}

function isSiteUnlocked() {
  const store = getGateStorage();
  return !!(store && store.getItem(SITE_GATE_STORAGE_KEY) === SITE_GATE_HASH);
}

function persistSiteUnlock() {
  const store = getGateStorage();
  if (!store) return false;
  try {
    store.setItem(SITE_GATE_STORAGE_KEY, SITE_GATE_HASH);
    return true;
  } catch {
    return false;
  }
}

function clearSiteUnlock() {
  const store = getGateStorage();
  if (!store) return;
  try {
    store.removeItem(SITE_GATE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} password
 * @returns {Promise<boolean>}
 */
async function tryUnlockSite(password) {
  const hash = await hashSitePassword(password);
  if (hash !== SITE_GATE_HASH) return false;
  persistSiteUnlock();
  return true;
}

function markDocumentUnlocked() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('site-locked');
  document.documentElement.classList.add('site-unlocked');
  const gate = document.getElementById('site-gate');
  if (gate) gate.remove();
}

function markDocumentLocked() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('site-locked');
  document.documentElement.classList.remove('site-unlocked');
}

function bindSiteGateForm(root) {
  const form = root.querySelector('#site-gate-form');
  const input = root.querySelector('#site-gate-password');
  const error = root.querySelector('#site-gate-error');
  if (!form || !input) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (error) error.hidden = true;
    const ok = await tryUnlockSite(input.value);
    if (!ok) {
      input.value = '';
      input.focus();
      if (error) error.hidden = false;
      return;
    }
    markDocumentUnlocked();
  });
  input.focus();
}

function siteGateMarkup() {
  return `
    <div class="site-gate__card" role="dialog" aria-modal="true" aria-labelledby="site-gate-title">
      <p class="site-gate__brand">JKSSB <em>PREP</em></p>
      <h1 id="site-gate-title" class="site-gate__title">Private access</h1>
      <p class="site-gate__copy">Enter the access code to open practice and mocks.</p>
      <form id="site-gate-form" class="site-gate__form">
        <label class="site-gate__label" for="site-gate-password">Access code</label>
        <input
          id="site-gate-password"
          class="site-gate__input"
          type="password"
          name="password"
          autocomplete="current-password"
          inputmode="numeric"
          required
        />
        <p id="site-gate-error" class="site-gate__error" hidden>That code is not correct.</p>
        <button type="submit" class="btn btn--primary site-gate__submit">Open site</button>
      </form>
    </div>`;
}

function mountSiteGate() {
  if (typeof document === 'undefined') return isSiteUnlocked();
  if (isSiteUnlocked()) {
    markDocumentUnlocked();
    return true;
  }
  markDocumentLocked();
  if (document.getElementById('site-gate')) return false;

  const attach = () => {
    if (document.getElementById('site-gate') || !document.body) return;
    const overlay = document.createElement('div');
    overlay.id = 'site-gate';
    overlay.className = 'site-gate';
    overlay.innerHTML = siteGateMarkup();
    document.body.appendChild(overlay);
    bindSiteGateForm(overlay);
  };

  if (document.body) attach();
  else document.addEventListener('DOMContentLoaded', attach, { once: true });
  return false;
}

if (typeof document !== 'undefined') {
  markDocumentLocked();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSiteGate, { once: true });
  } else {
    mountSiteGate();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SITE_GATE_HASH,
    SITE_GATE_STORAGE_KEY,
    hashSitePassword,
    isSiteUnlocked,
    tryUnlockSite,
    clearSiteUnlock,
    persistSiteUnlock,
    mountSiteGate,
  };
}
