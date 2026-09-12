/**
 * Browse categories and posts from catalog.json.
 */

async function initBrowsePage() {
  const main = initPage({ pageTitle: 'Browse', currentNav: 'Browse' });
  const root = document.getElementById('browse-root') || main;
  root.innerHTML = '<p class="muted">Loading posts…</p>';

  try {
    await loadCatalog();
  } catch (err) {
    showDataError(root, err.message || 'Could not load catalog.');
    return;
  }

  const cats = getCategories();
  if (!cats.length) {
    root.innerHTML = '';
    root.appendChild(UI.EmptyState({
      title: 'No posts yet',
      message: 'Post catalogs will appear here once datasets are added.',
    }));
    return;
  }

  const hash = (window.location.hash || '').replace(/^#/, '');
  root.innerHTML = cats.map((cat) => {
    const posts = (cat.posts || []).map((post) => `
      <a class="post-row" href="${pagesHref('post.html', { id: post.id })}">
        <span class="post-row__name">${escapeHtml(post.name)}</span>
        <span class="post-row__count">${post.question_count || 0} MCQs</span>
      </a>
    `).join('');
    return `
      <section class="browse-section" id="${escapeHtml(cat.id)}">
        <div class="browse-section__head">
          <span class="browse-section__badge">${escapeHtml(categoryIconLabel(cat.icon || cat.id))}</span>
          <div>
            <h2 class="browse-section__title">${escapeHtml(cat.name)}</h2>
            <p class="browse-section__meta">${(cat.posts || []).length} posts</p>
          </div>
        </div>
        <div class="post-list">${posts}</div>
      </section>
    `;
  }).join('');

  if (hash) {
    const target = document.getElementById(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', initBrowsePage);
