/**
 * Progress dashboard and bookmarks page logic.
 */

async function initProgressPage() {
  const main = initPage({ pageTitle: 'Progress', currentNav: 'Progress' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }
  renderProgress(main);
}

function renderProgress(main) {
  const progress = loadProgress();
  const history = loadTestHistory();
  const bookmarks = loadBookmarks();
  const base = getBasePath();
  const streak = getPracticeStreak(progress);
  const weakQueue = getWeakTopicQueue(progress);

  const topicEntries = Object.entries(progress.topicStats || {})
    .map(([topic, s]) => ({
      topic,
      accuracy: s.total ? (s.correct / s.total) * 100 : 0,
      total: s.total,
      correct: s.correct,
    }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  const attempted = (progress.attempts || []).length;
  const correctN = (progress.attempts || []).filter((a) => a.correct).length;
  const accuracy = attempted ? Math.round((correctN / attempted) * 100) : 0;
  const strongest = topicEntries.filter((t) => t.accuracy > 75).slice(0, 5);
  const needsAttention = [...topicEntries].sort((a, b) => a.accuracy - b.accuracy).filter((t) => t.accuracy < 60).slice(0, 5);

  main.innerHTML = `
    <section class="page-header">
      <h1>Your Progress</h1>
      <p class="page-header__sub">Track performance, streaks, and weak-topic drills.</p>
    </section>

    <div class="stats-grid">
      <div class="stat-card card">
        <span class="stat-card__label">Day streak</span>
        <span class="stat-card__value">${streak}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-card__label">Questions Attempted</span>
        <span class="stat-card__value">${attempted}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-card__label">Mock Tests</span>
        <span class="stat-card__value">${history.length}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-card__label">Attempt accuracy</span>
        <span class="stat-card__value">${accuracy}%</span>
      </div>
    </div>

    <section class="section card">
      <h2 class="section-title">This week’s plan</h2>
      <ol class="week-plan" id="week-plan"></ol>
    </section>

    <section class="section card">
      <h2 class="section-title">Weak-topic drill queue</h2>
      <div id="weak-queue"></div>
    </section>

    <div class="progress-columns">
      <section class="card">
        <h2 class="section-title">Strongest Topics</h2>
        <div id="strong-topics"></div>
      </section>
      <section class="card">
        <h2 class="section-title">Needs Attention</h2>
        <div id="weak-topics"></div>
      </section>
    </div>

    <section class="section card">
      <h2 class="section-title">Recent Tests</h2>
      <div id="recent-tests"></div>
    </section>

    <section class="section card">
      <h2 class="section-title">Backup & restore</h2>
      <p class="empty-inline">Export your progress to move across browsers, or import a backup JSON file.</p>
      <div class="cta-row">
        <button type="button" class="btn btn--secondary" id="export-data">Export progress</button>
        <label class="btn btn--ghost" for="import-data">Import progress<input type="file" id="import-data" accept="application/json,.json" hidden /></label>
      </div>
    </section>

    <div class="cta-row">
      <a href="${base}pages/bookmarks.html" class="btn btn--secondary">View Bookmarks (${bookmarks.length})</a>
      <a href="${base}pages/practice.html" class="btn btn--primary">Continue Practicing</a>
      <a href="${base}pages/mock.html" class="btn btn--ghost">Take a mock</a>
    </div>`;

  const queueEl = document.getElementById('weak-queue');
  if (!weakQueue.length) {
    queueEl.innerHTML = '<p class="empty-inline">No weak topics yet — complete a practice set or a mock first.</p>';
  } else {
    const ul = document.createElement('ul');
    ul.className = 'topic-list';
    weakQueue.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'topic-list__item';
      li.innerHTML = `
        <span>${escapeHtml(t.topic)} <span class="badge badge--muted">${Math.round(t.accuracy)}%</span></span>
        <a class="btn btn--sm btn--secondary" href="${pagesHref('practice.html', { topic: t.topic })}">Drill</a>`;
      ul.appendChild(li);
    });
    queueEl.appendChild(ul);
  }

  const weekPlan = document.getElementById('week-plan');
  weekPlan.innerHTML = faaWeekPlan(weakQueue).map((item) => `
    <li class="week-plan__item"><strong>${item.day}</strong> <span>${escapeHtml(item.text)}</span></li>
  `).join('');

  renderTopicList(document.getElementById('strong-topics'), strongest, 'No strong topics yet — keep practicing!');
  renderTopicList(document.getElementById('weak-topics'), needsAttention, 'No weak areas detected yet.');
  renderRecentTests(document.getElementById('recent-tests'), history, base);

  document.getElementById('export-data').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportUserData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jkssb-prep-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.Toast.show('Progress exported', 'success');
  });

  document.getElementById('import-data').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importUserData(JSON.parse(text));
      UI.Toast.show('Progress imported', 'success');
      renderProgress(main);
    } catch {
      UI.Toast.show('Could not import that file', 'warning');
    }
  });
}

function renderTopicList(container, topics, emptyMsg) {
  container.innerHTML = '';
  if (!topics.length) {
    container.innerHTML = `<p class="empty-inline">${escapeHtml(emptyMsg)}</p>`;
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'topic-list';
  topics.forEach((t) => {
    const perf = topicPerformanceLabel(t.accuracy);
    const li = document.createElement('li');
    li.className = 'topic-list__item';
    li.innerHTML = `
      <span>${escapeHtml(t.topic)}</span>
      <span class="topic-list__stat">${Math.round(t.accuracy)}% · ${t.correct}/${t.total}</span>`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

function renderRecentTests(container, history, base) {
  container.innerHTML = '';
  if (!history.length) {
    container.appendChild(UI.EmptyState({
      title: 'No tests yet',
      message: 'Take a mock test to track your scores over time.',
      actionLabel: 'Start mock test',
      actionUrl: `${base}pages/mock.html`,
    }));
    return;
  }
  const table = document.createElement('div');
  table.className = 'test-history';
  history.slice(0, 10).forEach((t) => {
    const row = document.createElement('a');
    row.href = `${base}pages/results.html?id=${encodeURIComponent(t.id)}`;
    row.className = 'test-history__row';
    row.innerHTML = `
      <span>${escapeHtml(t.examName || 'Mock Test')}</span>
      <span>${t.score}/${t.maxScore}</span>
      <span>${formatPercent(t.percentage)}</span>
      <span>${new Date(t.completedAt).toLocaleDateString()}</span>`;
    table.appendChild(row);
  });
  container.appendChild(table);
}

async function initBookmarksPage() {
  const main = initPage({ pageTitle: 'Bookmarks', currentNav: 'Progress' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }
  const bookmarks = loadBookmarks();
  const postsNeeded = new Set();
  bookmarks.forEach((id) => {
    const postId = [...DataStore.postsById.keys()]
      .sort((a, b) => b.length - a.length)
      .find((p) => id === p || id.startsWith(`${p}-`));
    if (postId) postsNeeded.add(postId);
  });
  await Promise.all([...postsNeeded].map((id) => loadPostDataset(id)));
  rebuildQuestionIndex();
  renderBookmarks(main);
}

function renderBookmarks(main) {
  const bookmarks = loadBookmarks();
  const base = getBasePath();
  main.innerHTML = `
    <section class="page-header">
      <h1>Bookmarked Questions</h1>
      <p class="page-header__sub">${bookmarks.length} saved question${bookmarks.length !== 1 ? 's' : ''}</p>
    </section>
    <div id="bookmarks-list" class="card-list"></div>
    <div class="cta-row">
      <a href="${base}pages/progress.html" class="btn btn--ghost">Back to Progress</a>
    </div>`;

  const list = document.getElementById('bookmarks-list');
  if (!bookmarks.length) {
    list.appendChild(UI.EmptyState({
      title: 'No bookmarks yet',
      message: 'Bookmark questions during practice to review them later.',
      actionLabel: 'Start practicing',
      actionUrl: `${base}pages/practice.html`,
    }));
    return;
  }

  bookmarks.forEach((id) => {
    const q = getQuestionById(id);
    if (q) {
      list.appendChild(UI.QuestionCard(q, {
        href: pagesHref('practice.html', { q: id }),
      }));
      return;
    }
    const orphan = document.createElement('article');
    orphan.className = 'mistake-card card';
    orphan.innerHTML = `
      <p class="mistake-card__text">Saved question <code>${escapeHtml(id)}</code> is no longer in the loaded banks (IDs were remapped).</p>
      <div class="mistake-card__meta">
        <button type="button" class="btn btn--sm btn--secondary" data-remove-bookmark="${escapeHtml(id)}">Remove</button>
      </div>`;
    orphan.querySelector('[data-remove-bookmark]').addEventListener('click', () => {
      removeBookmark(id);
      orphan.remove();
      UI.Toast.show('Bookmark removed', 'info', 2000);
    });
    list.appendChild(orphan);
  });
}

async function initPyqsPage() {
  // PYQs page replaced by Browse — soft redirect
  window.location.replace(pagesHref('post.html', { id: DEFAULT_POST_ID }));
}

async function initAdminPage() {
  const main = document.getElementById('main-content');
  document.title = 'Admin | JKSSB PREP';
  const dataResult = await initAppData({ mode: 'all' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }
  renderAdmin(main);
}

function renderAdmin(main) {
  const health = getDatasetHealth();
  main.innerHTML = `
    <section class="page-header">
      <h1>Dataset Health</h1>
      <p class="page-header__sub">Catalog and question-bank validation overview</p>
    </section>
    <div class="stats-grid">
      <div class="stat-card card"><span class="stat-card__label">Categories</span><span class="stat-card__value">${health.categories}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Posts</span><span class="stat-card__value">${health.postsTotal}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Empty banks</span><span class="stat-card__value">${health.postsEmpty}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Missing files</span><span class="stat-card__value">${health.postsMissing}</span></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card card"><span class="stat-card__label">Total Qs</span><span class="stat-card__value">${health.total}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Verified</span><span class="stat-card__value text-success">${health.statusCounts.verified || 0}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Needs Review</span><span class="stat-card__value">${health.statusCounts.needs_review || 0}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Invalid</span><span class="stat-card__value text-danger">${health.statusCounts.invalid || 0}</span></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card card"><span class="stat-card__label">Duplicates</span><span class="stat-card__value">${health.duplicates}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Missing Topic</span><span class="stat-card__value">${health.missingTopic}</span></div>
      <div class="stat-card card"><span class="stat-card__label">Missing Explanations</span><span class="stat-card__value">${health.missingExplanation}</span></div>
    </div>
    <section class="section card">
      <h2 class="section-title">Malformed Questions (${health.malformed.length})</h2>
      <div id="malformed-list"></div>
    </section>
    <p><a href="./index.html" class="btn btn--ghost">← Back to app</a></p>`;

  const list = document.getElementById('malformed-list');
  if (!health.malformed.length) {
    list.innerHTML = '<p class="empty-inline">No malformed questions detected.</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'malformed-list';
  health.malformed.forEach((m) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(m.question_id)}</strong>: ${m.issues.map(escapeHtml).join('; ')}`;
    ul.appendChild(li);
  });
  list.appendChild(ul);
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'bookmarks') initBookmarksPage();
  else if (page === 'pyqs') initPyqsPage();
  else if (page === 'admin') initAdminPage();
  else initProgressPage();
});
