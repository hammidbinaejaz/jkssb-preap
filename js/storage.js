/**
 * LocalStorage persistence for JKSSB PREP.
 * Keys: jkssb_user_progress, jkssb_bookmarks, jkssb_test_history,
 *       jkssb_active_test, jkssb_settings
 */

const STORAGE_KEYS = {
  progress: 'jkssb_user_progress',
  bookmarks: 'jkssb_bookmarks',
  testHistory: 'jkssb_test_history',
  activeTest: 'jkssb_active_test',
  settings: 'jkssb_settings',
  selectedPost: 'jkssb_selected_post',
};

/** @param {string} raw @param {*} fallback */
function safeParse(raw, fallback = null) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    /* unavailable */
  }
  return null;
}

function readKey(key, fallback) {
  const store = getStorage();
  if (!store) return fallback;
  return safeParse(store.getItem(key), fallback);
}

function writeKey(key, value) {
  const store = getStorage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function defaultProgress() {
  return {
    attempts: [],
    topicStats: {},
    lastActivity: null,
    continueUrl: null,
    continueLabel: null,
  };
}

function saveProgress(progress) {
  return writeKey(STORAGE_KEYS.progress, progress);
}

function loadProgress() {
  return readKey(STORAGE_KEYS.progress, defaultProgress());
}

function recordAttempt(attempt) {
  return recordAttempts(attempt ? [attempt] : []);
}

/** Batch-record practice or mock attempts into topic stats (one write). */
function recordAttempts(attempts) {
  const list = Array.isArray(attempts) ? attempts : [];
  if (!list.length) return loadProgress();
  const progress = loadProgress();
  progress.attempts = progress.attempts || [];
  progress.topicStats = progress.topicStats || {};
  list.forEach((attempt) => {
    progress.attempts.push({
      ...attempt,
      timestamp: attempt.timestamp || Date.now(),
    });
    const topic = attempt.topic || 'General';
    if (!progress.topicStats[topic]) {
      progress.topicStats[topic] = { correct: 0, total: 0 };
    }
    progress.topicStats[topic].total += 1;
    if (attempt.correct) progress.topicStats[topic].correct += 1;
  });
  if (progress.attempts.length > 5000) {
    progress.attempts = progress.attempts.slice(-5000);
  }
  progress.lastActivity = Date.now();
  saveProgress(progress);
  return progress;
}

/**
 * Fold a scored mock into learning progress (attempted questions only).
 * @param {object} result
 * @param {Map<string, object>|object} questionsById
 */
function recordMockProgress(result, questionsById) {
  const lookup = questionsById instanceof Map
    ? (id) => questionsById.get(id)
    : (id) => (questionsById || {})[id];
  const batch = [];
  (result?.questionIds || []).forEach((qid) => {
    const selected = result.answers ? result.answers[qid] : null;
    if (!selected) return;
    const q = lookup(qid) || {};
    batch.push({
      questionId: qid,
      selected,
      correct: selected === q.correct_option,
      topic: q.topic || 'General',
      subject: q.subject || '',
      mode: 'mock',
    });
  });
  return recordAttempts(batch);
}

function setContinuePreparation(url, label) {
  const progress = loadProgress();
  // Always persist root-stable paths so Home can resolve them correctly.
  let stored = url;
  if (typeof url === 'string') {
    stored = url
      .replace(/^\.\//, '')
      .replace(/^\.\.\//, '')
      .replace(/^pages\//, 'pages/');
    if (stored.startsWith('../')) stored = stored.replace(/^(\.\.\/)+/, '');
  }
  progress.continueUrl = stored;
  progress.continueLabel = label;
  progress.lastActivity = Date.now();
  saveProgress(progress);
}

function saveTest(testState) {
  return writeKey(STORAGE_KEYS.activeTest, testState);
}

function loadTest() {
  return readKey(STORAGE_KEYS.activeTest, null);
}

function clearActiveTest() {
  const store = getStorage();
  if (!store) return;
  store.removeItem(STORAGE_KEYS.activeTest);
}

function loadBookmarks() {
  return readKey(STORAGE_KEYS.bookmarks, []);
}

function isBookmarked(questionId) {
  return loadBookmarks().includes(questionId);
}

function saveBookmark(questionId) {
  const bookmarks = loadBookmarks();
  if (!bookmarks.includes(questionId)) {
    bookmarks.push(questionId);
    writeKey(STORAGE_KEYS.bookmarks, bookmarks);
  }
  return bookmarks;
}

function removeBookmark(questionId) {
  const bookmarks = loadBookmarks().filter((id) => id !== questionId);
  writeKey(STORAGE_KEYS.bookmarks, bookmarks);
  return bookmarks;
}

function toggleBookmark(questionId) {
  if (isBookmarked(questionId)) {
    removeBookmark(questionId);
    return false;
  }
  saveBookmark(questionId);
  return true;
}

function loadTestHistory() {
  return readKey(STORAGE_KEYS.testHistory, []);
}

function saveTestResult(result) {
  const history = loadTestHistory();
  history.unshift(result);
  if (history.length > 100) history.length = 100;
  writeKey(STORAGE_KEYS.testHistory, history);
  return history;
}

function loadSettings() {
  return readKey(STORAGE_KEYS.settings, {});
}

function saveSettings(settings) {
  return writeKey(STORAGE_KEYS.settings, settings);
}

function getLatestTestResult() {
  const history = loadTestHistory();
  return history.length ? history[0] : null;
}

/** @returns {{ postId: string, categoryId?: string, name?: string } | null} */
function loadSelectedPost() {
  const raw = readKey(STORAGE_KEYS.selectedPost, null);
  if (!raw) return null;
  if (typeof raw === 'string') return { postId: raw };
  return raw.postId ? raw : null;
}

/** @param {string} postId @param {{ categoryId?: string, name?: string }} [meta] */
function saveSelectedPost(postId, meta = {}) {
  return writeKey(STORAGE_KEYS.selectedPost, {
    postId,
    categoryId: meta.categoryId || null,
    name: meta.name || postId,
  });
}

function clearSelectedPostStorage() {
  const store = getStorage();
  if (!store) return;
  store.removeItem(STORAGE_KEYS.selectedPost);
}

/** Export all local progress for backup / multi-device restore. */
function exportUserData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: loadProgress(),
    bookmarks: loadBookmarks(),
    testHistory: loadTestHistory(),
    settings: loadSettings(),
    selectedPost: loadSelectedPost(),
  };
}

/** @param {object} payload */
function importUserData(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file');
  if (payload.progress) saveProgress(payload.progress);
  if (Array.isArray(payload.bookmarks)) writeKey(STORAGE_KEYS.bookmarks, payload.bookmarks);
  if (Array.isArray(payload.testHistory)) writeKey(STORAGE_KEYS.testHistory, payload.testHistory);
  if (payload.settings) saveSettings(payload.settings);
  if (payload.selectedPost?.postId) {
    saveSelectedPost(payload.selectedPost.postId, payload.selectedPost);
  }
  return true;
}

/** Compute practice streak from attempt timestamps (local days). */
function getPracticeStreak(progress = loadProgress()) {
  const days = new Set(
    (progress.attempts || [])
      .map((a) => {
        const d = new Date(a.timestamp || a.at || 0);
        if (Number.isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
      .filter(Boolean),
  );
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getWeakTopicQueue(progress = loadProgress(), limit = 5) {
  return Object.entries(progress.topicStats || {})
    .map(([topic, s]) => ({
      topic,
      accuracy: s.total ? (s.correct / s.total) * 100 : 0,
      total: s.total,
    }))
    .filter((t) => t.total >= 2 && t.accuracy < 65)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEYS,
    safeParse,
    defaultProgress,
    saveProgress,
    loadProgress,
    recordAttempt,
    recordAttempts,
    recordMockProgress,
    setContinuePreparation,
    saveTest,
    loadTest,
    clearActiveTest,
    loadBookmarks,
    isBookmarked,
    saveBookmark,
    removeBookmark,
    toggleBookmark,
    loadTestHistory,
    saveTestResult,
    loadSettings,
    saveSettings,
    getLatestTestResult,
    loadSelectedPost,
    saveSelectedPost,
    clearSelectedPostStorage,
    exportUserData,
    importUserData,
    getPracticeStreak,
    getWeakTopicQueue,
    _bindStorage: (mock) => { globalThis.localStorage = mock; },
  };
}
