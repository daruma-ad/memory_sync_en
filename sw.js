self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('anoano-store').then((cache) => cache.addAll([
      './',
      './index.html',
      './styles.css',
      './app.js',
      './icon.png',
      './manifest.json'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
