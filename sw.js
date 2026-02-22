const CACHE_NAME = 'sebitam-v2';
const ASSETS = [
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json',
  '/logo.jpg',
  '/logo-escolas-ibma.png',
  '/supabase-config.js'
];

// Instalação - cache dos assets principais
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpa cache antigo
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback para cache
self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith('http') && !e.request.url.includes('supabase.co') && !e.request.url.includes('cdn.') && !e.request.url.includes('unpkg.com') && !e.request.url.includes('fonts.googleapis')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
