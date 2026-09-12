/**
 * Shared utilities for JKSSB PREP.
 */

/** Fisher-Yates shuffle (returns new array). */
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** @param {number} seconds */
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Lowercase, collapse whitespace, strip punctuation for search. */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance between two strings. */
function editDistance(a, b) {
  const s = a || '';
  const t = b || '';
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/** Token match with edit distance ≤ 1 tolerance. */
function tokenMatches(queryToken, fieldToken) {
  if (!queryToken || !fieldToken) return false;
  if (fieldToken.includes(queryToken)) return true;
  if (queryToken.length >= 3 && editDistance(queryToken, fieldToken) <= 1) return true;
  return false;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPercent(n) {
  return `${Math.round(n * 10) / 10}%`;
}

function topicPerformanceLabel(accuracy) {
  if (accuracy > 75) return { label: 'Strong', className: 'perf-strong' };
  if (accuracy >= 60) return { label: 'Improving', className: 'perf-improving' };
  return { label: 'Needs Practice', className: 'perf-needs' };
}

/**
 * Score a mock test.
 * @param {object} params
 * @param {string[]} params.questionIds
 * @param {Record<string,string>} params.answers
 * @param {Map<string,object>|object[]} questionsById
 * @param {object} examConfig
 */
function scoreTest({ questionIds, answers, questionsById, examConfig }) {
  const marks = examConfig.marks_per_question ?? 1;
  const negative = examConfig.negative_marking ?? 0;
  const lookup = questionsById instanceof Map
    ? (id) => questionsById.get(id)
    : (id) => questionsById[id];

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const topicBreakdown = {};
  const mistakes = [];

  questionIds.forEach((qid) => {
    const q = lookup(qid);
    if (!q) return;
    const topic = q.topic || 'General';
    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = { correct: 0, total: 0, incorrect: 0 };
    }
    topicBreakdown[topic].total += 1;
    const selected = answers[qid];
    if (!selected) {
      unanswered += 1;
      return;
    }
    if (selected === q.correct_option) {
      correct += 1;
      topicBreakdown[topic].correct += 1;
    } else {
      incorrect += 1;
      topicBreakdown[topic].incorrect += 1;
      mistakes.push({ question: q, selected, correct: q.correct_option });
    }
  });

  const maxScore = questionIds.length * marks;
  const score = correct * marks - incorrect * negative;
  const percentage = questionIds.length ? (correct / questionIds.length) * 100 : 0;
  const accuracy = (correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0;

  return {
    correct,
    incorrect,
    unanswered,
    score,
    maxScore,
    percentage,
    accuracy,
    topicBreakdown,
    mistakes,
  };
}

/**
 * Rule-based study recommendations from progress + latest test.
 * @param {object} progress
 * @param {object|null} latestTest
 */
function getRecommendations(progress, latestTest) {
  const recs = [];
  const stats = progress?.topicStats || {};

  const weakTopics = Object.entries(stats)
    .map(([topic, s]) => ({
      topic,
      accuracy: s.total ? (s.correct / s.total) * 100 : 0,
      total: s.total,
    }))
    .filter((t) => t.total >= 3 && t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy);

  weakTopics.slice(0, 3).forEach((t) => {
    recs.push({
      type: 'weak_topic',
      title: `Practice ${t.topic}`,
      description: `Your accuracy is ${Math.round(t.accuracy)}% across ${t.total} attempts. Focus here to improve.`,
      actionUrl: `pages/practice.html?topic=${encodeURIComponent(t.topic)}`,
      actionLabel: 'Practice this topic',
    });
  });

  if (latestTest?.mistakes?.length) {
    const mistakeTopics = {};
    latestTest.mistakes.forEach((m) => {
      const topic = m.question?.topic || 'General';
      mistakeTopics[topic] = (mistakeTopics[topic] || 0) + 1;
    });
    const top = Object.entries(mistakeTopics).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      recs.push({
        type: 'mistake_review',
        title: `Review mistakes in ${top[0]}`,
        description: `You missed ${top[1]} question${top[1] > 1 ? 's' : ''} in your last mock test.`,
        actionUrl: `pages/practice.html?topic=${encodeURIComponent(top[0])}`,
        actionLabel: 'Practice weak area',
      });
    }
  }

  if (!recs.length) {
    recs.push({
      type: 'general',
      title: 'Keep practicing',
      description: 'Complete a mock test or practice session to unlock personalized recommendations.',
      actionUrl: 'pages/practice.html',
      actionLabel: 'Start practicing',
    });
  }

  return recs;
}

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getQueryParam(name) {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    shuffle,
    formatTime,
    clamp,
    normalize,
    editDistance,
    tokenMatches,
    escapeHtml,
    formatPercent,
    topicPerformanceLabel,
    scoreTest,
    getRecommendations,
    generateId,
    getQueryParam,
  };
}
