/* Offline shell for JKSSB PREP */
const CACHE = 'jkssb-prep-v6';
const CORE = [
  './',
  './index.html',
  './css/main.css',
  './css/components.css',
  './css/responsive.css',
  './js/app.js',
  './js/data.js',
  './js/storage.js',
  './js/utils.js',
  './js/ui.js',
  './js/browse.js',
  './js/practice.js',
  './js/numericals.js',
  './js/mock.js',
  './js/search.js',
  './js/results.js',
  './js/post.js',
  './js/progress.js',
  './js/typing.js',
  './pages/browse.html',
  './pages/practice.html',
  './pages/mock.html',
  './pages/search.html',
  './pages/results.html',
  './pages/progress.html',
  './pages/bookmarks.html',
  './pages/post.html',
  './pages/typing.html',
  './data/catalog.json',
  './data/exams.json',
  './assets/logo/logo.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && req.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
