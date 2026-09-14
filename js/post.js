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

  main.innerHTML = `
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="${getBasePath()}index.html">Home</a>
      <span aria-hidden="true">/</span>
      <span>${escapeHtml(post.categoryName || 'Finance')}</span>
    </nav>
    <section class="page-header page-header--post">
      <p class="eyebrow">${escapeHtml(exam.notification || post.categoryName || '')}</p>
      <h1>${escapeHtml(post.name)}</h1>
      <p class="page-header__sub">
        ${ready
          ? `${loaded} MCQs in the bank · official paper is 120 questions in 120 minutes`
          : missing
            ? 'Question bank file is not available yet.'
            : 'Question bank is empty for now.'}
      </p>
    </section>

    <div class="post-hub__stats" aria-label="Exam configuration">
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${exam.default_question_count}</span>
        <span class="post-hub__stat-label">Paper Qs</span>
      </div>
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${exam.duration_minutes}</span>
        <span class="post-hub__stat-label">Minutes</span>
      </div>
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">−${exam.negative_marking}</span>
        <span class="post-hub__stat-label">Wrong answer</span>
      </div>
      <div class="post-hub__stat">
        <span class="post-hub__stat-value">${loaded}</span>
        <span class="post-hub__stat-label">Bank MCQs</span>
      </div>
    </div>

    <section class="section card post-guide">
      <h2 class="section-title" style="margin-top:0;">Syllabus & pattern</h2>
      <p class="empty-inline">${escapeHtml(exam.pattern || 'Check the latest JKSSB advertisement for official pattern.')}</p>
      ${exam.syllabus_summary ? `<p class="empty-inline"><strong>Official mix:</strong> ${escapeHtml(exam.syllabus_summary)}</p>` : ''}
      ${(exam.sections || []).length ? `
        <div class="subject-grid" style="margin-top:1rem;">
          ${exam.sections.map((s) => `
            <a class="post-hub__action" href="${pagesHref('practice.html', { subject: s.name })}">
              <span class="post-hub__action-title">${escapeHtml(s.name)}</span>
              <p class="post-hub__action-desc">${s.marks} marks in the real paper · 500 practice MCQs</p>
            </a>`).join('')}
        </div>` : ''}
    </section>

    <div class="post-actions">
      <a class="btn btn--primary" href="${practiceHref}">${escapeHtml(practiceLabel)}</a>
      <a class="btn btn--secondary" href="${pagesHref('mock.html')}">Official 120 mock</a>
      <a class="btn btn--ghost" href="${pagesHref('search.html')}">Search this bank</a>
    </div>

    <section class="section card post-guide">
      <h2 class="section-title" style="margin-top:0;">Suggested path</h2>
      <ol class="path-list">
        <li>Drill one official subject at a time (Accountancy and GK carry 30 marks each)</li>
        <li>Lock easy / medium / hard once the mixed set feels comfortable</li>
        <li>Sit the official 120 paper (−0.25), then return to weak subjects</li>
      </ol>
    </section>

    <div class="cta-row">
      <a href="${getBasePath()}index.html" class="btn btn--ghost">← Home</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initPostPage);
