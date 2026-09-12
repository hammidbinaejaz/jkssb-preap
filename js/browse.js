/**
 * Browse page — category tabs and post explorer.
 */

async function initBrowsePage() {
  const main = initPage({ pageTitle: 'Browse', currentNav: 'Browse' });
  const dataResult = await initAppData({ mode: 'shell' });
  if (!dataResult.ok) {
    showDataError(main, dataResult.error);
    return;
  }

  const categories = getCategories();
  if (!categories.length) {
    main.appendChild(UI.EmptyState({
      title: 'No categories yet',
      message: 'The exam catalog is empty. Add data/catalog.json to get started.',
    }));
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const hash = (window.location.hash || '').replace(/^#/, '');
  let activeId = params.get('category') || hash || categories[0].id;
  if (!categories.some((c) => c.id === activeId)) activeId = categories[0].id;

  main.innerHTML = `
    <section class="page-header">
      <h1>Browse posts</h1>
      <p class="page-header__sub">Choose a category, then open a post to practice, mock, or search.</p>
    </section>
    <div class="browse-tabs" id="browse-tabs" role="tablist" aria-label="Categories"></div>
    <div id="browse-panel"></div>`;

  const tabsEl = document.getElementById('browse-tabs');
  const panelEl = document.getElementById('browse-panel');

  function renderTabs() {
    tabsEl.innerHTML = categories.map((cat) => `
      <button type="button" class="browse-tab${cat.id === activeId ? ' browse-tab--active' : ''}"
        role="tab" aria-selected="${cat.id === activeId}" data-category="${escapeHtml(cat.id)}">
        ${escapeHtml(cat.name)}
      </button>`).join('');

    tabsEl.querySelectorAll('.browse-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeId = btn.dataset.category;
        const url = new URL(window.location.href);
        url.searchParams.set('category', activeId);
        url.hash = '';
        window.history.replaceState({}, '', url);
        renderTabs();
        renderPanel();
      });
    });
  }

  function renderPanel() {
    const cat = categories.find((c) => c.id === activeId);
    panelEl.innerHTML = '';
    if (!cat?.posts?.length) {
      panelEl.appendChild(UI.EmptyState({
        title: 'No posts in this category',
        message: 'Posts will appear here once they are added to the catalog.',
      }));
      return;
    }

    const section = document.createElement('section');
    section.className = 'browse-section';
    section.id = cat.id;
    section.innerHTML = `
      <div class="browse-section__head">
        <span class="browse-section__badge">${escapeHtml(categoryIconLabel(cat.icon || cat.id))}</span>
        <div>
          <h2 class="browse-section__title">${escapeHtml(cat.name)}</h2>
          <p class="browse-section__meta">${(cat.posts || []).length} posts${cat.description ? ` · ${escapeHtml(cat.description)}` : ''}</p>
        </div>
      </div>`;

    const list = document.createElement('div');
    list.className = 'post-list';
    cat.posts.forEach((post) => {
      const ds = DataStore.datasets[post.id];
      const count = ds?.questions?.length ?? post.question_count ?? 0;
      const a = document.createElement('a');
      a.className = 'post-row';
      a.href = pagesHref('post.html', { id: post.id });
      a.innerHTML = `
        <span class="post-row__name">${escapeHtml(post.name)}</span>
        <span class="post-row__count">${count} MCQs</span>`;
      list.appendChild(a);
    });
    section.appendChild(list);
    panelEl.appendChild(section);
  }

  renderTabs();
  renderPanel();
}

document.addEventListener('DOMContentLoaded', initBrowsePage);
