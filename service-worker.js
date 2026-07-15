/**
 * service-worker.js — Offline-first caching
 * Precaches the entire app shell on install so the app works completely
 * offline after the first visit. Runtime requests (e.g. Google Fonts)
 * are cached opportunistically as they're fetched.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `habit-recovery-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './js/core/db.js',
  './js/core/auth.js',
  './js/core/router.js',
  './js/services/habits.js',
  './js/services/journal.js',
  './js/services/urge.js',
  './js/ui/components.js',
  './js/ui/dashboard.js',
  './js/ui/checkin.js',
  './js/ui/urgeScreen.js',
  './js/ui/journalScreen.js',
  './js/ui/triggerScreen.js',
  './js/ui/goalsScreen.js',
  './js/ui/achievementsScreen.js',
  './js/ui/statsScreen.js',
  './js/ui/calendarScreen.js',
  './js/ui/settingsScreen.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Opportunistically cache same-origin (and font) responses for future offline use.
          const isFont = request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com');
          const isSameOrigin = request.url.startsWith(self.location.origin);
          if (response.ok && (isSameOrigin || isFont)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached: fall back to the app shell for navigations.
          if (request.mode === 'navigate') return caches.match('./index.html');
          return undefined;
        });
    })
  );
});
