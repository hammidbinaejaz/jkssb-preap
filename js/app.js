/**
 * Shared app bootstrap: navigation, paths, layout helpers.
 */

function getBasePath() {
  if (typeof window === 'undefined') return './';
  return window.location.pathname.includes('/pages/') ? '../' : './';
}

function getPagesPath() {
  return `${getBasePath()}pages/`;
}

/** Build a path to a page under pages/ from root or nested routes. */
function pagesHref(filename, query = {}) {
  const base = getBasePath();
  let href = `${base}pages/${filename.replace(/^pages\//, '')}`;
  const qs = new URLSearchParams(query).toString();
  if (qs) href += `?${qs}`;
  return href;
}

function navLink(href, label, current) {
  const isActive = current === label;
  return `<a href="${href}" class="nav-link${isActive ? ' nav-link--active' : ''}"${isActive ? ' aria-current="page"' : ''}>${label}</a>`;
}

const NAV_ITEMS = [
  { label: 'Home', href: (b) => `${b}index.html`, key: 'Home' },
  { label: 'Browse', href: (b) => `${b}pages/browse.html`, key: 'Browse' },
  { label: 'Search', href: (b) => `${b}pages/search.html`, key: 'Search' },
  { label: 'Practice', href: (b) => `${b}pages/practice.html`, key: 'Practice' },
  { label: 'Mock Tests', href: (b) => `${b}pages/mock.html`, key: 'Mock Tests' },
  { label: 'Progress', href: (b) => `${b}pages/progress.html`, key: 'Progress' },
];

function renderNav(currentPage) {
  const base = getBasePath();
  const desktop = NAV_ITEMS.map((item) => navLink(item.href(base), item.label, currentPage)).join('');
  const mobile = NAV_ITEMS.map((item) => {
    const isActive = currentPage === item.label;
    return `<a href="${item.href(base)}" class="bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}" aria-label="${item.label}"${isActive ? ' aria-current="page"' : ''}>
      <span class="bottom-nav__icon" aria-hidden="true">${navIcon(item.key)}</span>
      <span class="bottom-nav__label">${item.key === 'Mock Tests' ? 'Mock' : item.label}</span>
    </a>`;
  }).join('');

  return `
    <header class="site-header">
      <div class="container site-header__inner">
        <a href="${base}index.html" class="brand" aria-label="JKSSB PREP Home">
          <img src="${base}assets/logo/logo.svg" alt="" class="brand__logo" width="32" height="32" />
          <span class="brand__name">JKSSB PREP</span>
        </a>
        <nav class="nav-desktop" aria-label="Main navigation">${desktop}</nav>
      </div>
    </header>
    <nav class="bottom-nav" aria-label="Mobile navigation">${mobile}</nav>`;
}

function navIcon(key) {
  const icons = {
    Home: '⌂',
    Browse: '☰',
    Practice: '✎',
    Search: '⌕',
    'Mock Tests': '⏱',
    Progress: '◈',
  };
  return icons[key] || '•';
}

function renderFooter() {
  const base = getBasePath();
  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p class="site-footer__text">JKSSB PREP — Focused exam preparation</p>
        <a href="${base}admin.html" class="site-footer__admin">Admin</a>
      </div>
    </footer>`;
}

function initPage({ pageTitle, currentNav, mainId = 'main-content' }) {
  document.title = `${pageTitle} | JKSSB PREP`;
  const navSlot = document.getElementById('site-nav');
  if (navSlot) navSlot.innerHTML = renderNav(currentNav);
  const footerSlot = document.getElementById('site-footer');
  if (footerSlot) footerSlot.innerHTML = renderFooter();
  return document.getElementById(mainId);
}

async function initAppData() {
  try {
    await loadAllData();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: DataStore.loadError || err.message };
  }
}

function showDataError(container, message) {
  container.innerHTML = '';
  container.appendChild(UI.EmptyState({
    icon: '⚠️',
    title: 'Unable to load questions',
    message: message || 'Please check your connection and try again.',
    actionLabel: 'Reload',
    actionUrl: window.location.href,
  }));
}

/**
 * Compact strip showing the currently selected post.
 * @param {HTMLElement} container
 * @param {{ allowClear?: boolean }} [opts]
 */
function renderPostContext(container, opts = {}) {
  if (!container) return;
  const meta = typeof getSelectedPostMeta === 'function' ? getSelectedPostMeta() : null;
  if (!meta) {
    container.innerHTML = `
      <div class="post-context">
        <span class="post-context__label">Post</span>
        <span class="post-context__name">All posts</span>
        <a href="${pagesHref('browse.html')}" class="btn btn--ghost btn--sm">Choose a post</a>
      </div>`;
    return;
  }
  container.innerHTML = `
    <div class="post-context">
      <span class="post-context__label">Preparing for</span>
      <span class="post-context__name">${escapeHtml(meta.name)}</span>
      <a href="${pagesHref('post.html', { id: meta.id })}" class="btn btn--ghost btn--sm">Post hub</a>
      <a href="${pagesHref('browse.html')}" class="btn btn--ghost btn--sm">Change</a>
      ${opts.allowClear ? '<button type="button" class="btn btn--ghost btn--sm" id="clear-post-filter">Clear filter</button>' : ''}
    </div>`;
  const clearBtn = container.querySelector('#clear-post-filter');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearSelectedPost();
      renderPostContext(container, opts);
      if (opts.onClear) opts.onClear();
    });
  }
}

function categoryIconLabel(icon) {
  const map = {
    finance: 'Fin',
    clerical: 'Clr',
    revenue: 'Rev',
  };
  return map[icon] || (icon || 'Cat').slice(0, 3);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBasePath,
    getPagesPath,
    pagesHref,
    initPage,
    initAppData,
    renderPostContext,
    categoryIconLabel,
  };
}
