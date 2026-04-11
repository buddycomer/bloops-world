// Force all devices to clear old caches completely
const CACHE = 'bloops-world-v9';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/minigames/dancegrid.css',
  '/js/game.js',
  '/js/audio.js',
  '/js/monsters.js',
  '/js/combos.js',
  '/js/minigames/dancegrid.js',
  '/assets/zane.png',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    // Wipe ALL old caches first
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE))
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
