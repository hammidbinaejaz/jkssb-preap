/**
 * Post hub — syllabus, pattern, and actions for one exam post.
 */

async function initPostPage() {
  const main = initPage({ pageTitle: 'Exam', currentNav: 'Exam' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const postId = getQueryParam('id') || DEFAULT_POST_ID;
  const post = getPost(postId) || getPost(DEFAULT_POST_ID);

  if (!post) {
    main.appendChild(UI.EmptyState({
      title: 'Exam not found',
      message: 'The Accounts Assistant (Finance) bank could not be loaded.',
      actionLabel: 'Home',
      actionUrl: `${getBasePath()}index.html`,
    }));
    return;
  }

  setSelectedPost(post.id, post.categoryId);
  await loadPostDataset(post.id);
  rebuildQuestionIndex();

  const ds = DataStore.datasets[post.id];
  const exam = getExamConfigForPost(post.id);
  const loaded = ds?.questions?.length ?? 0;
  const shared = (ds?.questions || []).filter((q) => q.pool_type === 'shared_syllabus_pool').length;
  const primary = loaded - shared;
  const missing = Boolean(ds?.missing);
  const ready = loaded > 0;
  document.title = `${post.name} | JKSSB PREP`;
  const pendingPractice = (loadProgress().continueUrl || '').startsWith('pages/practice.html')
    ? loadProgress().continueUrl
    : '';
  const practiceHref = pendingPractice ? resolveAppHref(pendingPractice) : pagesHref('practice.html');
  const practiceLabel = pendingPractice && pendingPractice.includes('topic=')
    ? 'Continue topic drill'
    : 'Start practice';
  setContinuePreparation(rootPagesPath('post.html', { id: post.id }), `${post.name} — ready to practice`);

  const isClericalSkill = /steno|typist|data-entry|computer/i.test(post.id);

  main.innerHTML = `
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="${getBasePath()}index.html">Home</a>
      <span aria-hidden="true">/</span>
      <span>${escapeHtml(post.categoryName || 'Finance')}</span>
    </nav>
    <section class="page-header page-header--post">
      <p class="eyebrow">${escapeHtml(post.categoryName || '')}</p>
      <h1>${escapeHtml(post.name)}</h1>
      <p class="page-header__sub">
        ${ready
          ? `${loaded} questions loaded · ${primary} post-focused · ${shared} shared syllabus pool`
          : missing
            ? 'Question bank file is not available yet.'
            : 'Question bank is empty for now.'}
      </p>
    </section>

    <div class="post-hub__stats" aria-label="Exam configuration">
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${exam.duration_minutes}</span>
        <span class="post-hub__stat-label">Minutes</span>
      </div>
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${exam.marks_per_question}</span>
        <span class="post-hub__stat-label">Mark / Q</span>
      </div>
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${exam.negative_marking}</span>
        <span class="post-hub__stat-label">Negative</span>
      </div>
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${loaded}</span>
        <span class="post-hub__stat-label">Questions</span>
      </div>
    </div>

    <section class="section card post-guide">
      <h2 class="section-title" style="margin-top:0;">Syllabus & pattern</h2>
      <p class="empty-inline">${escapeHtml(exam.pattern || 'Check the latest JKSSB advertisement for official pattern.')}</p>
      ${exam.syllabus_summary ? `<p class="empty-inline"><strong>Focus areas:</strong> ${escapeHtml(exam.syllabus_summary)}</p>` : ''}
      ${(exam.sections || []).length ? `
        <ul class="path-list">
          ${exam.sections.map((s) => `<li><strong>${escapeHtml(s.name)}</strong> — ${(s.subjects || []).map(escapeHtml).join(', ')}</li>`).join('')}
        </ul>` : ''}
      <p class="empty-inline" style="margin-top:0.75rem;">Shared pool questions are labelled in search/practice metadata when PYQ coverage is limited.</p>
    </section>

    <div class="post-actions">
      <a class="btn btn--primary" href="${practiceHref}">${escapeHtml(practiceLabel)}</a>
      <a class="btn btn--secondary" href="${pagesHref('mock.html')}">Take mock test</a>
      <a class="btn btn--ghost" href="${pagesHref('search.html')}">Search this bank</a>
      ${isClericalSkill ? `<a class="btn btn--ghost" href="${pagesHref('typing.html')}">Typing drill</a>` : ''}
    </div>

    <section class="section card post-guide">
      <h2 class="section-title" style="margin-top:0;">Suggested path</h2>
      <ol class="path-list">
        <li>Practice a short set and read explanations immediately</li>
        <li>Search weak topics within this post</li>
        <li>Sit a timed mock (with correct negative marking), then drill weak areas</li>
      </ol>
    </section>

    <div class="cta-row">
      <a href="${getBasePath()}index.html" class="btn btn--ghost">← Home</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initPostPage);
