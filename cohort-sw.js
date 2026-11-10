// Cohort service worker (v24).
// Own files: network first, cached copy when offline. Versioned CDN libraries (React, fonts, icons): cached after
// first use so the app also opens offline. The Google endpoint is never touched.
const CACHE = 'cohort-v24';
const OWN = ['./Cohort.dc.html','./index.html','./CohortReview.dc.html','./support.js','./cohort-core.js','./cohort-data.js','./cohort.webmanifest',
  './logo.png','./cohort-icon-192.png','./cohort-icon-512.png','./cohort-icon-180.png','./gas/Code.gs','./gas/WebApp.gs','./gas/AI.gs'];
const CDN = /^https:\/\/(unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(OWN.map(u => c.add(u).catch(() => null)))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = req.url;
  if(req.method !== 'GET') return;
  if(/script\.google(usercontent)?\.com|googleapis\.com\/(?!css)|groq\.com/.test(url) && !/fonts\.googleapis\.com/.test(url)) return;
  if(CDN.test(url)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if(res && (res.ok || res.type === 'opaque')){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return res;
    })));
    return;
  }
  if(new URL(url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if(res && res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./Cohort.dc.html') : undefined))));
});
