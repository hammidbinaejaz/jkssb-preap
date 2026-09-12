/**
 * Search page logic with ranked, typo-tolerant matching.
 */

function buildSearchIndex(questions) {
  return questions.map((q) => {
    const fields = [
      q.question,
      ...(q.options || []).map((o) => o.text),
      q.subject,
      q.topic,
      q.subtopic,
      ...(q.tags || []),
      q.source?.label,
      q.source?.file,
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

function searchQuestions(questions, query) {
  const q = normalize(query);
  if (!q) return [];
  const queryTokens = q.split(' ').filter(Boolean);
  const index = buildSearchIndex(questions);
  return index
    .map((entry) => ({ entry, score: scoreSearchResult(entry, queryTokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry.question);
}

async function initSearchPage() {
  const main = initPage({ pageTitle: 'Search', currentNav: 'Search' });
  const dataResult = await initAppData();
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  const selectedMeta = getSelectedPostMeta();
  let scope = selectedMeta ? 'post' : 'all';

  main.innerHTML = `
    <section class="page-header">
      <h1>Search Questions</h1>
      <p class="page-header__sub">Find questions by keyword, topic, or subject.</p>
    </section>
    <div id="post-context-slot"></div>
    <div id="search-container"></div>
    <div id="search-scope" class="search-scope" role="group" aria-label="Search scope"></div>
    <div id="search-results" class="search-results" aria-live="polite"></div>`;

  const searchContainer = document.getElementById('search-container');
  const scopeEl = document.getElementById('search-scope');
  const resultsEl = document.getElementById('search-results');

  renderPostContext(document.getElementById('post-context-slot'), {
    allowClear: true,
    onClear: () => {
      scope = 'all';
      renderScope();
      renderResults(document.getElementById('search-input')?.value || '');
    },
  });

  function getSearchPool() {
    const meta = getSelectedPostMeta();
    if (scope === 'post' && meta) return getActiveQuestions();
    return DataStore.allQuestions;
  }

  function renderScope() {
    const meta = getSelectedPostMeta();
    if (!meta) {
      scope = 'all';
      scopeEl.innerHTML = `
        <span class="search-scope__label">Searching:</span>
        <button type="button" class="filter-chip filter-chip--active" disabled>All posts</button>`;
      return;
    }

    scopeEl.innerHTML = `
      <span class="search-scope__label">Searching:</span>
      <button type="button" class="filter-chip${scope === 'post' ? ' filter-chip--active' : ''}" data-scope="post">${escapeHtml(meta.name)}</button>
      <button type="button" class="filter-chip${scope === 'all' ? ' filter-chip--active' : ''}" data-scope="all">All posts</button>`;

    scopeEl.querySelectorAll('[data-scope]').forEach((btn) => {
      btn.addEventListener('click', () => {
        scope = btn.dataset.scope;
        renderScope();
        renderResults(document.getElementById('search-input')?.value || '');
      });
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
    if (!query.trim()) {
      resultsEl.appendChild(UI.EmptyState({
        title: 'Start searching',
        message: meta && scope === 'post'
          ? `Enter a keyword to search within ${meta.name}.`
          : 'Enter a keyword, topic name, or subject to find matching questions.',
      }));
      return;
    }
    const pool = getSearchPool();
    const results = searchQuestions(pool, query);
    if (!results.length) {
      resultsEl.appendChild(UI.EmptyState({
        title: 'No results found',
        message: scope === 'post' && meta
          ? `No questions match "${query}" in ${meta.name}. Try "All posts" or different keywords.`
          : `No questions match "${query}". Try different keywords or check spelling.`,
      }));
      return;
    }
    const scopeNote = scope === 'post' && meta ? ` in ${meta.name}` : '';
    const heading = document.createElement('p');
    heading.className = 'results-count';
    heading.textContent = `${results.length} question${results.length !== 1 ? 's' : ''} found${scopeNote}`;
    resultsEl.appendChild(heading);
    const list = document.createElement('div');
    list.className = 'card-list';
    results.forEach((q) => {
      list.appendChild(UI.QuestionCard(q, {
        href: pagesHref('practice.html', { q: q.question_id }),
      }));
    });
    resultsEl.appendChild(list);
  }

  renderScope();
  if (initialQuery) renderResults(initialQuery);
  else renderResults('');
}

document.addEventListener('DOMContentLoaded', initSearchPage);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchQuestions, scoreSearchResult, buildSearchIndex };
}
