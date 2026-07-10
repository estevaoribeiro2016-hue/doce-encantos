const CACHE='doce-encanto-v56-9';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.hostname.includes('viacep.com.br')||u.hostname.includes('brasilapi.com.br')||u.hostname.includes('supabase.co'))return; e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
