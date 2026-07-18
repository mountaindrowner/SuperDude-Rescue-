// Super Dude Danny - offline-capable service worker.
//
// Cache-first strategy: on install we precache the shell (HTML, CSS, JS,
// images, fonts). On fetch, serve from cache when possible and fall back
// to the network. New deploys bump CACHE_NAME to evict the old cache on
// activation so updates roll out cleanly without leaving stale JS.

const CACHE_NAME = 'sdd-shell-v201';

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
  './js/level_8_1.js',
  './js/cyber_decor_8_1.js',
  './js/quiz_data.js',
  './js/scripture_data.js',
  './js/scenes.js',
  './js/main.js',
  './assets/title.png',
  './assets/lab.png',
  './assets/New Assets/New Overworld.png',
  './assets/timemachine.png',
  './assets/timemachine_broken.png',
  './assets/level 6 bugs background.png',
  './assets/city/far_skyline.png',
  './assets/city/mid_city.png',
  './assets/city/bridge.png',
  './assets/city/foreground.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-512-maskable.png',
  './assets/apple-touch-icon.png',
  // v2.0: THE ELEMENT LAB sub-game code shell. Its MP3s + card JPEGs are
  // NOT precached (same lazy policy as the main game's music) - they
  // runtime-cache on first play.
  './games/element-lab/index.html',
  './games/element-lab/vendor/phaser.min.js',
  './games/element-lab/src/config.js',
  './games/element-lab/src/i18n.js',
  './games/element-lab/src/store.js',
  './games/element-lab/src/audio.js',
  './games/element-lab/src/textures.js',
  './games/element-lab/src/jelly.js',
  './games/element-lab/src/ui.js',
  './games/element-lab/src/background.js',
  './games/element-lab/src/boot.js',
  './games/element-lab/src/preload.js',
  './games/element-lab/src/menu.js',
  './games/element-lab/src/game.js',
  './games/element-lab/src/overlays.js',
  './games/element-lab/src/cards.js',
  './games/element-lab/src/main.js',
  './games/element-lab/assets/fonts/baloo2-400.woff2',
  './games/element-lab/assets/fonts/baloo2-700.woff2',
  './games/element-lab/assets/fonts/pixelify-400.woff2',
  './games/element-lab/assets/fonts/pixelify-700.woff2',
  './games/element-lab/assets/px/bg.png',
  './games/element-lab/assets/px/ball_1.png',
  './games/element-lab/assets/px/ball_2.png',
  './games/element-lab/assets/px/ball_3.png',
  './games/element-lab/assets/px/ball_4.png',
  './games/element-lab/assets/px/ball_5.png',
  './games/element-lab/assets/px/ball_6.png',
  './games/element-lab/assets/px/ball_7.png',
  './games/element-lab/assets/px/ball_8.png',
  './games/element-lab/assets/px/ball_9.png'
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

// v1.0.5 (research finding): Safari sends Range: bytes=0-1 as the FIRST
// request for any <audio> element and expects a 206 Partial Content
// response. The Cache API can only store 200 OK responses, so a naive
// cache.match() returning a 200 to a Range request makes Safari STOP
// playback (the "silent MP3 killer" on iOS PWAs). Below: detect Range
// requests, fetch the full cached blob, slice it into a synthesized 206
// with a correct Content-Range header. Source: web.dev/sw-range-requests,
// philna.sh "service workers: beware Safari's range request".
async function rangeResponse(request, cachedResponse) {
  var rangeHeader = request.headers.get('range') || '';
  var match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) return cachedResponse;          // not a Range request: pass through
  var fullBuf = await cachedResponse.clone().arrayBuffer();
  var total = fullBuf.byteLength;
  var start = match[1] === '' ? 0 : parseInt(match[1], 10);
  var end   = match[2] === '' ? total - 1 : parseInt(match[2], 10);
  if (start >= total || end >= total) {
    return new Response(null, { status: 416, statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': 'bytes */' + total } });
  }
  var slice = fullBuf.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cachedResponse.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Length': String(slice.byteLength),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', function (event) {
  // Same-origin GETs only - leave cross-origin (CDN, analytics if any)
  // untouched.
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Code files (HTML/CSS/JS/JSON/manifest) use network-first: always
  // try the network so a fresh deploy shows up on the very next
  // reload, fall back to cache only if offline. Large + rarely-changed
  // assets (images, audio, fonts) stay cache-first so they don't
  // re-download every visit.
  var path = url.pathname;
  var isAudio = /\.(mp3|ogg|wav|m4a|aac)$/i.test(path);
  var isCode = /\.(html?|js|mjs|css|json|webmanifest)$/i.test(path)
            || path === '/' || path.endsWith('/');

  if (isCode) {
    event.respondWith(
      fetch(event.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return resp;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
    return;
  }

  // Cache-first for everything else. For audio files, if we have a
  // cached 200 and the browser sent a Range request, slice it into a 206
  // (see rangeResponse above) so Safari/iOS don't drop the stream.
  event.respondWith(
    caches.match(event.request, { ignoreVary: true, ignoreSearch: false }).then(function (cached) {
      if (cached) {
        if (isAudio && event.request.headers.has('range')) {
          return rangeResponse(event.request, cached);
        }
        return cached;
      }
      // No cached copy: fetch (passing Range header through so the
      // network response itself is already a 206 if requested), and
      // only cache a FULL 200 (you can't put a 206 into the Cache API).
      return fetch(event.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return resp;
      }).catch(function () {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
