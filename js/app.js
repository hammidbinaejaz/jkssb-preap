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
  { label: 'Practice', href: (b) => `${b}pages/practice.html`, key: 'Practice' },
  { label: 'Search', href: (b) => `${b}pages/search.html`, key: 'Search' },
  { label: 'Mock Tests', href: (b) => `${b}pages/mock.html`, key: 'Mock Tests' },
  { label: 'PYQs', href: (b) => `${b}pages/pyqs.html`, key: 'PYQs' },
  { label: 'Progress', href: (b) => `${b}pages/progress.html`, key: 'Progress' },
];

function renderNav(currentPage) {
  const base = getBasePath();
  const desktop = NAV_ITEMS.map((item) => navLink(item.href(base), item.label, currentPage)).join('');
  const mobile = NAV_ITEMS.map((item) => {
    const isActive = currentPage === item.label;
    return `<a href="${item.href(base)}" class="bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}" aria-label="${item.label}"${isActive ? ' aria-current="page"' : ''}>
      <span class="bottom-nav__icon" aria-hidden="true">${navIcon(item.key)}</span>
      <span class="bottom-nav__label">${item.label}</span>
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
    Practice: '✎',
    Search: '⌕',
    'Mock Tests': '⏱',
    PYQs: '📄',
    Progress: '📊',
  };
  return icons[key] || '•';
}

function renderFooter() {
  const base = getBasePath();
  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p class="site-footer__text">JKSSB PREP — Exam preparation tool</p>
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getBasePath, getPagesPath, pagesHref, initPage, initAppData };
}
