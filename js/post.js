/**
 * Post hub — select a post and jump into Practice / Mock / Search.
 */

async function initPostPage() {
  const main = initPage({ pageTitle: 'Post', currentNav: 'Browse' });
  const dataResult = await initAppData();
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const postId = getQueryParam('id');
  const post = postId ? getPost(postId) : null;

  if (!post) {
    main.appendChild(UI.EmptyState({
      title: postId ? 'Post not found' : 'No post selected',
      message: 'Choose a post from Browse to continue.',
      actionLabel: 'Browse posts',
      actionUrl: pagesHref('browse.html'),
    }));
    return;
  }

  setSelectedPost(post.id, post.categoryId);
  const ds = DataStore.datasets[post.id];
  const loaded = ds?.questions?.length ?? 0;
  const missing = Boolean(ds?.missing);
  const ready = loaded > 0;
  document.title = `${post.name} | JKSSB PREP`;

  setContinuePreparation(pagesHref('post.html', { id: post.id }), `${post.name} — ready to practice`);

  main.innerHTML = `
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="${pagesHref('browse.html')}">Browse</a>
      <span aria-hidden="true">/</span>
      <a href="${pagesHref('browse.html', { category: post.categoryId })}">${escapeHtml(post.categoryName || '')}</a>
    </nav>
    <section class="page-header page-header--post">
      <p class="eyebrow">${escapeHtml(post.categoryName || '')}</p>
      <h1>${escapeHtml(post.name)}</h1>
      <p class="page-header__sub">
        ${ready
          ? `${loaded} questions loaded and ready for practice.`
          : missing
            ? 'Question bank file is not available yet. The UI is ready — content coming soon.'
            : 'Question bank is empty for now. You can still open the hub once questions are added.'}
      </p>
    </section>

    <div class="post-actions">
      <a class="btn btn--primary" href="${pagesHref('practice.html')}">Start practice</a>
      <a class="btn btn--secondary" href="${pagesHref('mock.html')}">Take mock test</a>
      <a class="btn btn--ghost" href="${pagesHref('search.html')}">Search this bank</a>
    </div>

    ${!ready ? `
      <div class="card" style="margin-bottom:1.5rem;">
        <h2 class="section-title" style="margin-top:0;">Waiting for question bank</h2>
        <p class="empty-inline">Expected file: <code>data/${escapeHtml(post.file)}</code>. Questions will load automatically once the file is present.</p>
      </div>` : ''}

    <section class="section card post-guide">
      <h2 class="section-title" style="margin-top:0;">Suggested path</h2>
      <ol class="path-list">
        <li>Practice a short set and review mistakes immediately</li>
        <li>Search weak topics within this post</li>
        <li>Sit a timed mock, then practice the recommended weak area</li>
      </ol>
    </section>

    <div class="cta-row">
      <a href="${pagesHref('browse.html', { category: post.categoryId })}" class="btn btn--ghost">← Back to browse</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initPostPage);
