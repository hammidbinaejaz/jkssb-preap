/**
 * Data loading and question queries.
 */

const DataStore = {
  index: null,
  exams: null,
  datasets: {},
  allQuestions: [],
  questionsById: new Map(),
  loading: null,
};

function getDataBasePath() {
  if (typeof window === 'undefined') return './';
  return window.location.pathname.includes('/pages/') ? '../' : './';
}

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function loadIndex() {
  const base = getDataBasePath();
  DataStore.index = await fetchJson(`${base}data/index.json`);
  return DataStore.index;
}

async function loadExams() {
  const base = getDataBasePath();
  DataStore.exams = await fetchJson(`${base}data/exams.json`);
  return DataStore.exams;
}

async function loadDataset(datasetId) {
  if (DataStore.datasets[datasetId]) return DataStore.datasets[datasetId];
  const base = getDataBasePath();
  const meta = DataStore.index?.datasets?.find((d) => d.id === datasetId);
  const file = meta?.file || `${datasetId}.json`;
  const dataset = await fetchJson(`${base}data/${file}`);
  DataStore.datasets[datasetId] = dataset;
  return dataset;
}

async function loadAllData() {
  if (DataStore.loading) return DataStore.loading;
  DataStore.loading = (async () => {
    try {
      await loadIndex();
      await loadExams();
      const ids = DataStore.index?.datasets?.map((d) => d.id) || [];
      await Promise.all(ids.map((id) => loadDataset(id)));
      DataStore.allQuestions = [];
      DataStore.questionsById.clear();
      ids.forEach((id) => {
        const ds = DataStore.datasets[id];
        (ds?.questions || []).forEach((q) => {
          DataStore.allQuestions.push(q);
          DataStore.questionsById.set(q.question_id, q);
        });
      });
      return DataStore;
    } catch (err) {
      console.error('Data load failed:', err);
      DataStore.loadError = err.message || 'Failed to load question data';
      throw err;
    }
  })();
  return DataStore.loading;
}

function getQuestionById(id) {
  return DataStore.questionsById.get(id) || null;
}

function getPracticeQuestions(filters = {}) {
  const { subject, topic, difficulty, count = 10 } = filters;
  let pool = DataStore.allQuestions.filter((q) => {
    if (q.verification_status === 'invalid') return false;
    if (!q.correct_option) return false;
    if (q.verification_status !== 'verified' && q.verification_status !== 'needs_review') return false;
    if (subject && q.subject !== subject) return false;
    if (topic && q.topic !== topic) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
  pool = shuffle(pool).slice(0, count);
  return pool;
}

function getMockQuestions(count, examConfig) {
  const datasetId = examConfig?.dataset_id;
  const ds = datasetId ? DataStore.datasets[datasetId] : null;
  const source = ds?.questions || DataStore.allQuestions;
  const verified = source.filter(
    (q) => q.verification_status === 'verified' && q.correct_option,
  );
  return shuffle(verified).slice(0, Math.min(count, verified.length));
}

function getSubjects() {
  return [...new Set(DataStore.allQuestions.map((q) => q.subject).filter(Boolean))].sort();
}

function getTopics(subject) {
  let qs = DataStore.allQuestions;
  if (subject) qs = qs.filter((q) => q.subject === subject);
  return [...new Set(qs.map((q) => q.topic).filter(Boolean))].sort();
}

function getDifficulties() {
  return [...new Set(DataStore.allQuestions.map((q) => q.difficulty).filter(Boolean))].sort();
}

function getRelatedQuestions(question, limit = 4) {
  if (!question) return [];
  const keywords = normalize(question.question).split(' ').filter((w) => w.length > 4);
  const scored = DataStore.allQuestions
    .filter((q) => q.question_id !== question.question_id && q.correct_option)
    .map((q) => {
      let score = 0;
      if (q.topic === question.topic) score += 5;
      if (q.subject === question.subject) score += 3;
      if (q.difficulty === question.difficulty) score += 2;
      const qText = normalize(q.question);
      keywords.forEach((kw) => {
        if (qText.includes(kw)) score += 1;
      });
      return { q, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.q);
}

function getDatasetHealth() {
  const qs = DataStore.allQuestions;
  const statusCounts = { verified: 0, needs_review: 0, invalid: 0 };
  let duplicates = 0;
  let missingTopic = 0;
  let missingExplanation = 0;
  const malformed = [];

  qs.forEach((q) => {
    statusCounts[q.verification_status] = (statusCounts[q.verification_status] || 0) + 1;
    if (q.duplicate_status === 'possible_duplicate') duplicates += 1;
    if (!q.topic) missingTopic += 1;
    if (!q.explanation) missingExplanation += 1;
    const issues = [];
    if (!q.question || q.question.length < 10) issues.push('Missing or short question text');
    if (!Array.isArray(q.options) || q.options.length < 2) issues.push('Invalid options');
    if (!q.correct_option && q.verification_status !== 'invalid') issues.push('Missing correct option');
    if (issues.length) malformed.push({ question_id: q.question_id, issues });
  });

  return {
    total: qs.length,
    statusCounts,
    duplicates,
    missingTopic,
    missingExplanation,
    malformed,
  };
}

