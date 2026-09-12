/**
 * Post hub — practice / mock / search entry for one exam post.
 */

async function initPostPage() {
  const main = initPage({ pageTitle: 'Post', currentNav: 'Browse' });
  const root = document.getElementById('post-root') || main;
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    root.innerHTML = '';
    root.appendChild(UI.EmptyState({
      title: 'No post selected',
      message: 'Choose a post from Browse to continue.',
      actionLabel: 'Browse posts',
      actionUrl: pagesHref('browse.html'),
    }));
    return;
  }

  root.innerHTML = '<p class="muted">Loading post…</p>';

  try {
    await loadCatalog();
    await loadPostDataset(postId);
  } catch (err) {
    showDataError(root, err.message);
    return;
  }

  const meta = getPost(postId);
  const ds = DataStore.datasets[postId];
  if (!meta) {
    root.innerHTML = '';
    root.appendChild(UI.EmptyState({
      title: 'Post not found',
      message: 'This post is not in the catalog.',
      actionLabel: 'Browse posts',
      actionUrl: pagesHref('browse.html'),
    }));
    return;
  }

  setSelectedPost(postId, meta.categoryId);
  const count = ds?.question_count || meta.question_count || 0;
  document.title = `${meta.name} | JKSSB PREP`;

  root.innerHTML = `
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="${pagesHref('browse.html')}">Browse</a>
      <span aria-hidden="true">/</span>
      <span>${escapeHtml(meta.categoryName || '')}</span>
    </nav>
    <header class="page-header page-header--post">
      <p class="eyebrow">${escapeHtml(meta.categoryName || '')}</p>
      <h1>${escapeHtml(meta.name)}</h1>
      <p class="page-header__sub">${count} questions in this bank · schema: question, options A–D, correct, subject, topic, year, source</p>
    </header>
    <div class="post-actions">
      <a class="btn btn--primary" href="${pagesHref('practice.html')}">Start practice</a>
      <a class="btn btn--secondary" href="${pagesHref('mock.html')}">Take mock test</a>
      <a class="btn btn--ghost" href="${pagesHref('search.html')}">Search this bank</a>
    </div>
    <section class="section card post-guide">
      <h2 class="section-title">Suggested path</h2>
      <ol class="path-list">
        <li>Practice a short set and review mistakes immediately</li>
        <li>Search weak topics (e.g. banking, J&amp;K history, computer)</li>
        <li>Sit a timed mock, then practice the recommended weak area</li>
      </ol>
    </section>
  `;

  const progress = loadProgress();
  progress.continueUrl = pagesHref('post.html', { id: postId });
  progress.continueLabel = `${meta.name} — ready to practice`;
  saveProgress(progress);
}

document.addEventListener('DOMContentLoaded', initPostPage);
