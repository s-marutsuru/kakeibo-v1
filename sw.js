// sw.js
const CACHE_NAME = 'kakeibo-pwa-v1';
const ASSETS = ['/', '/kakeibo-v1/index.html','/kakeibo-v1/styles.css','/kakeibo-v1/firebase.js','/kakeibo-v1/app.js','/kakeibo-v1/manifest.webmanifest',
  '/kakeibo-v1/icons/favicon-32.png','/kakeibo-v1/icons/icon-192.png','/kakeibo-v1/icons/icon-512.png','/icons/apple-touch-180.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', e=>{
  if (e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(net=>{
    const copy = net.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request, copy)).catch(()=>{}); return net;
  }).catch(()=> caches.match('/index.html'))));
});
