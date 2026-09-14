/**
 * Browse redirects to the FAA exam hub — this app is single-post.
 */

async function initBrowsePage() {
  initPage({ pageTitle: 'Exam', currentNav: 'Exam' });
  window.location.replace(pagesHref('post.html', { id: DEFAULT_POST_ID }));
}

document.addEventListener('DOMContentLoaded', initBrowsePage);
