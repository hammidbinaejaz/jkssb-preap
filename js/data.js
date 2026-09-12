/**
 * Catalog + question-bank loading.
 * Normalizes flat qbank fields into the internal question model.
 */

const DataStore = {
  catalog: null,
  /** @type {Record<string, object>} postId → loaded qbank */
  datasets: {},
  allQuestions: [],
  questionsById: new Map(),
  postsById: new Map(),
  loadError: null,
  loading: null,
};

const SELECTED_POST_KEY = 'jkssb_selected_post';

/**
 * Map flat qbank question (option_a…correct) or legacy shape → internal model.
 * @param {object} raw
 * @param {object} [context]
 * @returns {object}
 */
function normalizeQuestion(raw, context = {}) {
  if (!raw || typeof raw !== 'object') return null;

  let options = raw.options;
  if (!Array.isArray(options) || !options.length) {
    options = [
      { id: 'A', text: raw.option_a ?? '' },
      { id: 'B', text: raw.option_b ?? '' },
      { id: 'C', text: raw.option_c ?? '' },
      { id: 'D', text: raw.option_d ?? '' },
    ].filter((o) => o.text !== '' && o.text != null);
  } else {
    options = options.map((o) => ({
      id: String(o.id || '').toUpperCase(),
      text: o.text ?? '',
    }));
  }

  const correctRaw = raw.correct_option ?? raw.correct ?? '';
  const correct_option = String(correctRaw).trim().toUpperCase() || null;

  let source = raw.source;
  if (typeof source === 'string') {
    source = { label: source };
  } else if (!source || typeof source !== 'object') {
    source = { label: 'JKSSB' };
  }

  return {
    question_id: raw.question_id || '',
    question: raw.question || '',
    options,
    correct_option,
    subject: raw.subject || context.category || '',
    topic: raw.topic || '',
    subtopic: raw.subtopic || '',
    difficulty: raw.difficulty || '',
    year: raw.year || '',
    exam: raw.exam || context.post_name || '',
    explanation: raw.explanation || '',
    verification_status: raw.verification_status || 'needs_review',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    duplicate_status: raw.duplicate_status || 'unique',
    post_id: raw.post_id || context.post_id || '',
    category: raw.category || context.category || '',
    source,
  };
}

function getDataBasePath() {
  if (typeof window === 'undefined') return './';
  return window.location.pathname.includes('/pages/') ? '../' : './';
}

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

/**
 * Soft-fetch: missing qbank files return null instead of throwing.
 * @param {string} path
 */
async function fetchJsonOptional(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function indexCatalog(catalog) {
  DataStore.postsById.clear();
  (catalog?.categories || []).forEach((cat) => {
    (cat.posts || []).forEach((post) => {
      DataStore.postsById.set(post.id, { ...post, categoryId: cat.id, categoryName: cat.name });
    });
  });
}

async function loadCatalog() {
  const base = getDataBasePath();
  DataStore.catalog = await fetchJson(`${base}data/catalog.json`);
  indexCatalog(DataStore.catalog);
  return DataStore.catalog;
}

/**
 * Load a single post qbank and normalize questions.
 * @param {string} postId
 */
async function loadPostDataset(postId) {
  if (DataStore.datasets[postId]) return DataStore.datasets[postId];
  const meta = DataStore.postsById.get(postId);
  if (!meta) return null;

  const base = getDataBasePath();
  const file = meta.file || `qbanks/${meta.categoryId}/${postId}.json`;
  const raw = await fetchJsonOptional(`${base}data/${file}`);

  const context = {
    post_id: postId,
    post_name: meta.name,
    category: meta.categoryName,
  };

  if (!raw) {
    const empty = {
      post_id: postId,
      post_name: meta.name,
      category: meta.categoryName,
      question_count: 0,
      questions: [],
      missing: true,
    };
    DataStore.datasets[postId] = empty;
    return empty;
  }

  const questions = (raw.questions || [])
    .map((q) => normalizeQuestion(q, context))
    .filter(Boolean);

  const dataset = {
    post_id: raw.post_id || postId,
    post_name: raw.post_name || meta.name,
    category: raw.category || meta.categoryName,
    question_count: questions.length,
    questions,
    missing: false,
  };
  DataStore.datasets[postId] = dataset;
  return dataset;
}

function rebuildQuestionIndex() {
  DataStore.allQuestions = [];
  DataStore.questionsById.clear();
  Object.values(DataStore.datasets).forEach((ds) => {
    (ds?.questions || []).forEach((q) => {
      DataStore.allQuestions.push(q);
      if (q.question_id) DataStore.questionsById.set(q.question_id, q);
    });
  });
}

async function loadAllData() {
  if (DataStore.loading) return DataStore.loading;
  DataStore.loading = (async () => {
    try {
      DataStore.loadError = null;
      await loadCatalog();
      const postIds = [...DataStore.postsById.keys()];
      await Promise.all(postIds.map((id) => loadPostDataset(id)));
      rebuildQuestionIndex();
      return DataStore;
    } catch (err) {
      console.error('Data load failed:', err);
      DataStore.loadError = err.message || 'Failed to load question data';
      throw err;
    }
  })();
  return DataStore.loading;
}

function getCategories() {
  return DataStore.catalog?.categories || [];
}

function getPost(postId) {
  return DataStore.postsById.get(postId) || null;
}

function getSelectedPostId() {
  try {
    const raw = localStorage.getItem(SELECTED_POST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    return parsed?.postId || null;
  } catch {
    return null;
  }
}

function getSelectedPostMeta() {
  const id = getSelectedPostId();
  return id ? getPost(id) : null;
}

function setSelectedPost(postId, categoryId) {
  const meta = getPost(postId);
  const payload = {
    postId,
    categoryId: categoryId || meta?.categoryId || null,
    name: meta?.name || postId,
  };
  try {
    localStorage.setItem(SELECTED_POST_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return payload;
}

function clearSelectedPost() {
  try {
    localStorage.removeItem(SELECTED_POST_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Questions scoped to the selected post (or all if none selected).
 * @returns {object[]}
 */
function getActiveQuestions() {
  const postId = getSelectedPostId();
  if (!postId) return DataStore.allQuestions;
  const ds = DataStore.datasets[postId];
  return ds?.questions || [];
}

function getQuestionById(id) {
  return DataStore.questionsById.get(id) || null;
}

function getPracticeQuestions(filters = {}) {
  const { subject, topic, difficulty, count = 10, postId } = filters;
  const source = postId
    ? (DataStore.datasets[postId]?.questions || [])
    : getActiveQuestions();

  let pool = source.filter((q) => {
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

/**
 * Build a mock exam config for a post (or defaults).
 * @param {string} [postId]
 */
function getExamConfigForPost(postId) {
  const id = postId || getSelectedPostId();
  const meta = id ? getPost(id) : null;
  const ds = id ? DataStore.datasets[id] : null;
  const available = (ds?.questions || []).filter(
    (q) => q.verification_status === 'verified' && q.correct_option,
  ).length;
  const defaultCount = Math.min(30, available || 30);

  return {
    id: id || 'general-mock',
    name: meta?.name ? `${meta.name} Mock` : 'General Mock Test',
    dataset_id: id || null,
    duration_minutes: 30,
    default_question_count: defaultCount || 30,
    marks_per_question: 1,
    negative_marking: 0,
    allowed_counts: [10, 20, 30, 50, 100].filter((c) => c <= Math.max(available, 10) || c <= 30),
  };
}

function getMockQuestions(count, examConfig) {
  const datasetId = examConfig?.dataset_id || getSelectedPostId();
  const ds = datasetId ? DataStore.datasets[datasetId] : null;
  const source = ds?.questions || getActiveQuestions();
  const verified = source.filter(
    (q) => q.verification_status === 'verified' && q.correct_option,
  );
  return shuffle(verified).slice(0, Math.min(count, verified.length));
}

function getSubjects(questions) {
  const qs = questions || getActiveQuestions();
  return [...new Set(qs.map((q) => q.subject).filter(Boolean))].sort();
}

function getTopics(subject, questions) {
  let qs = questions || getActiveQuestions();
  if (subject) qs = qs.filter((q) => q.subject === subject);
  return [...new Set(qs.map((q) => q.topic).filter(Boolean))].sort();
}

function getDifficulties(questions) {
  const qs = questions || getActiveQuestions();
  return [...new Set(qs.map((q) => q.difficulty).filter(Boolean))].sort();
}

function getRelatedQuestions(question, limit = 4) {
  if (!question) return [];
  const pool = getActiveQuestions();
  const keywords = normalize(question.question).split(' ').filter((w) => w.length > 4);
  const scored = pool
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

  const categories = getCategories();
  const postsTotal = [...DataStore.postsById.keys()].length;
  const postsLoaded = Object.values(DataStore.datasets).filter((d) => !d.missing).length;
  const postsEmpty = Object.values(DataStore.datasets).filter(
    (d) => !d.missing && (!d.questions || !d.questions.length),
  ).length;
  const postsMissing = Object.values(DataStore.datasets).filter((d) => d.missing).length;

  return {
    total: qs.length,
    statusCounts,
    duplicates,
    missingTopic,
    missingExplanation,
    malformed,
    categories: categories.length,
    postsTotal,
    postsLoaded,
    postsEmpty,
    postsMissing,
  };
}

function getCategoryQuestionCount(categoryId) {
  const cat = getCategories().find((c) => c.id === categoryId);
  if (!cat) return 0;
  return (cat.posts || []).reduce((sum, p) => {
    const ds = DataStore.datasets[p.id];
    return sum + (ds?.questions?.length ?? p.question_count ?? 0);
  }, 0);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DataStore,
    SELECTED_POST_KEY,
    normalizeQuestion,
    getDataBasePath,
    loadCatalog,
    loadPostDataset,
    loadAllData,
    getCategories,
    getPost,
    getSelectedPostId,
    getSelectedPostMeta,
    setSelectedPost,
    clearSelectedPost,
    getActiveQuestions,
    getQuestionById,
    getPracticeQuestions,
    getExamConfigForPost,
    getMockQuestions,
    getSubjects,
    getTopics,
    getDifficulties,
    getRelatedQuestions,
    getDatasetHealth,
    getCategoryQuestionCount,
  };
}
