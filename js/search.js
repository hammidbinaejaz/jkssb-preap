/**
 * Search with subject/year filters and cached index.
 */

let cachedIndex = null;
let cachedPoolKey = '';

function buildSearchIndex(questions) {
  return questions.map((q) => {
    const fields = [
      q.question,
      ...(q.options || []).map((o) => o.text),
      q.subject,
      q.topic,
      q.subtopic,
      ...(q.tags || []),
      typeof q.source === 'string' ? q.source : q.source?.label,
      q.year,
      q.pool_type,
    ].filter(Boolean);
    return {
      question: q,
      normalized: normalize(fields.join(' ')),
      tokens: normalize(fields.join(' ')).split(' ').filter(Boolean),
    };
  });
}

function scoreSearchResult(entry, queryTokens) {
  let score = 0;
  queryTokens.forEach((qt) => {
    if (entry.normalized.includes(qt)) {
      score += 10;
      return;
    }
    entry.tokens.forEach((ft) => {
      if (tokenMatches(qt, ft)) score += 5;
    });
    if (entry.question.topic && normalize(entry.question.topic).includes(qt)) score += 8;
    if (entry.question.subject && normalize(entry.question.subject).includes(qt)) score += 6;
    (entry.question.tags || []).forEach((tag) => {
      if (normalize(tag).includes(qt)) score += 4;
    });
  });
  return score;
}

function searchQuestions(questions, query, { subject, year } = {}) {
  let pool = questions;
  if (subject) pool = pool.filter((q) => q.subject === subject);
  if (year) pool = pool.filter((q) => String(q.year) === String(year));

  const q = normalize(query);
  if (!q) return pool.slice(0, 50);

  const poolKey = `${pool.length}:${subject || ''}:${year || ''}:${pool[0]?.question_id || ''}`;
  if (!cachedIndex || cachedPoolKey !== poolKey) {
    cachedIndex = buildSearchIndex(pool);
    cachedPoolKey = poolKey;
  }

  const queryTokens = q.split(' ').filter(Boolean);
  return cachedIndex
    .map((entry) => ({ entry, score: scoreSearchResult(entry, queryTokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry.question);
}

async function initSearchPage() {
  const main = initPage({ pageTitle: 'Search', currentNav: 'Search' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  let scope = 'post';
  let subjectFilter = params.get('subject') || '';
  let yearFilter = params.get('year') || '';

  main.innerHTML = `
    <section class="page-header">
      <h1>Search Questions</h1>
      <p class="page-header__sub">Find FAA questions by keyword, topic, subject, or year.</p>
    </section>
    <div id="post-context-slot"></div>
    <div id="search-container"></div>
    <div id="search-scope" class="search-scope" role="group" aria-label="Search scope"></div>
    <div class="filter-form card" id="search-filters" style="margin:1rem 0;"></div>
    <div id="search-results" class="search-results" aria-live="polite"></div>`;

  const searchContainer = document.getElementById('search-container');
  const scopeEl = document.getElementById('search-scope');
  const filtersEl = document.getElementById('search-filters');
  const resultsEl = document.getElementById('search-results');

  renderPostContext(document.getElementById('post-context-slot'));

  function getSearchPool() {
    return getActiveQuestions().length ? getActiveQuestions() : DataStore.allQuestions;
  }

  function renderScope() {
    const meta = getSelectedPostMeta();
    scopeEl.innerHTML = `
      <span class="search-scope__label">Searching:</span>
      <button type="button" class="filter-chip filter-chip--active" disabled>${escapeHtml(meta?.name || 'Accounts Assistant (Finance)')}</button>`;
  }

  function renderFilters() {
    const pool = getSearchPool();
    const subjects = [...new Set(pool.map((q) => q.subject).filter(Boolean))].sort();
    const years = [...new Set(pool.map((q) => q.year).filter(Boolean))].sort();
    filtersEl.innerHTML = `
      <div class="form-row">
        <label for="filter-subject">Subject</label>
        <select id="filter-subject">
          <option value="">Any subject</option>
          ${subjects.map((s) => `<option value="${escapeHtml(s)}"${s === subjectFilter ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <label for="filter-year">Year</label>
        <select id="filter-year">
          <option value="">Any year</option>
          ${years.map((y) => `<option value="${escapeHtml(String(y))}"${String(y) === String(yearFilter) ? ' selected' : ''}>${escapeHtml(String(y))}</option>`).join('')}
        </select>
      </div>`;
    filtersEl.querySelector('#filter-subject').addEventListener('change', (e) => {
      subjectFilter = e.target.value;
      cachedIndex = null;
      renderResults(document.getElementById('search-input')?.value || '');
    });
    filtersEl.querySelector('#filter-year').addEventListener('change', (e) => {
      yearFilter = e.target.value;
      cachedIndex = null;
      renderResults(document.getElementById('search-input')?.value || '');
    });
  }

  const bar = UI.SearchBar({
    placeholder: 'Search questions, topics or keywords...',
    value: initialQuery,
    onSearch: (query) => {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
      renderResults(query);
    },
  });
  searchContainer.appendChild(bar);

  function renderResults(query) {
    const meta = getSelectedPostMeta();
    resultsEl.innerHTML = '';
    const pool = getSearchPool();
    const results = searchQuestions(pool, query, { subject: subjectFilter, year: yearFilter });
    if (!query.trim() && !subjectFilter && !yearFilter) {
      resultsEl.appendChild(UI.EmptyState({
        title: 'Start searching',
        message: 'Try banking, Jhelum, computer, or filter by subject/year.',
      }));
      return;
    }
    if (!results.length) {
      resultsEl.appendChild(UI.EmptyState({
        title: 'No results found',
        message: 'Try different keywords or clear filters.',
      }));
      return;
    }
    const heading = document.createElement('p');
    heading.className = 'results-count';
    heading.textContent = `${results.length} question${results.length !== 1 ? 's' : ''} found${meta && scope === 'post' ? ` in ${meta.name}` : ''}`;
    resultsEl.appendChild(heading);
    const list = document.createElement('div');
    list.className = 'card-list';
    results.slice(0, 100).forEach((q) => {
      list.appendChild(UI.QuestionCard(q, {
        href: pagesHref('practice.html', { q: q.question_id }),
      }));
    });
    resultsEl.appendChild(list);
  }

  renderScope();
  renderFilters();
  renderResults(initialQuery);
}

document.addEventListener('DOMContentLoaded', initSearchPage);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchQuestions, scoreSearchResult, buildSearchIndex };
}
