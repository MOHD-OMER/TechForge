/* TechForge service worker — offline support.
 * Strategy: network-first for HTML navigations (fresh content, offline
 * fallback), cache-first for static assets (CSS/JS/fonts/images). */
const VERSION = 'tf-v1';
const STATIC_CACHE = 'tf-static-' + VERSION;
const PAGE_CACHE = 'tf-pages-' + VERSION;
const OFFLINE_URL = '/offline.html';

// Minimal precache — the offline fallback + icon. Everything else is cached
// at runtime on first request, which avoids brittle ?v= query mismatches.
const PRECACHE = [OFFLINE_URL, '/assets/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (fonts CDN) pass through

  // HTML navigations → network-first, fall back to cache, then offline page.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static assets → cache-first, then network (and cache the result).
  if (['style', 'script', 'font', 'image'].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit))
    );
  }
});
