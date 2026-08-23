// Cohort service worker — network-first for the app, cache as offline fallback
const CACHE='cohort-v2';
const ASSETS=['./index.html','./cohort-data.js','./support.js','./CohortReview.dc.html','./cohort.webmanifest','./logo.png','./cohort-icon-192.png','./cohort-icon-512.png','./cohort-icon-180.png'];
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{}))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(u.includes('script.google.com')||u.includes('googleapis')) return; // never touch the sync endpoint
  if(e.request.method!=='GET') return;
  // Network-first: always try the live file, fall back to cache only when offline.
  e.respondWith(fetch(e.request).then(res=>{
    if(res&&res.ok&&res.type==='basic'){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); }
    return res;
  }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});