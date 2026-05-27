// Super Dude Danny - offline-capable service worker.
//
// Cache-first strategy: on install we precache the shell (HTML, CSS, JS,
// images, fonts). On fetch, serve from cache when possible and fall back
// to the network. New deploys bump CACHE_NAME to evict the old cache on
// activation so updates roll out cleanly without leaving stale JS.

const CACHE_NAME = 'sdd-shell-v15';

// Precache list. Includes every game-script + the painted images that
// scenes.js reaches for. Music files are NOT precached - they're big and
// audio.js loads them lazily; the browser caches them via normal HTTP.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/save.js',
  './js/input.js',
  './js/audio.js',
  './js/sprites.js',
  './js/engine.js',
  './js/entities.js',
  './js/level1.js',
  './js/level_2_1.js',
  './js/level_2_2.js',
  './js/level_3_1.js',
  './js/level_3_2.js',
  './js/level_4_1.js',
  './js/level_4_2.js',
  './js/level_5_1.js',
  './js/level_5_2.js',
  './js/level_6_1.js',
  './js/level_6_2.js',
  './js/level_7_1.js',
  './js/quiz_data.js',
  './js/scenes.js',
  './js/main.js',
  './assets/title.png',
  './assets/lab.png',
  './assets/overworld.png',
  './assets/timemachine.png',
  './assets/timemachine_broken.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-512-maskable.png',
  './assets/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // addAll fails the whole install if ANY url 404s. To be resilient
      // against asset drift, we add each entry individually and ignore
      // misses - the runtime fetch handler will catch real bugs.
      return Promise.all(PRECACHE_URLS.map(function (url) {
        return cache.add(url).catch(function () { /* skip missing */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        if (n !== CACHE_NAME) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  // Same-origin GETs only - leave audio range requests + cross-origin
  // (CDN, analytics if any) untouched.
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (resp) {
        // Stash successful responses for next time. Stream-clone before
        // returning since the response body can only be read once.
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return resp;
      }).catch(function () {
        // Offline + uncached = serve the shell so navigation requests
        // still land somewhere useful.
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
