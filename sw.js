const CACHE='doce-encanto-v20';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','assets/style.css','assets/app.js','assets/mascote.png','assets/pix-qrcode.png','manifest.webmanifest']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
