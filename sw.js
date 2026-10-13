// Service worker ringkas: cache shell app supaya app boleh dipasang & dibuka pantas.
// Network-first untuk fail app sendiri (kemas kini cepat); panggilan Google API tidak di-cache.
// App lain di alamat github.io yang sama (cth. /bajet/) berkongsi storan cache;
// hanya urus cache yang bermula dengan awalan app ini.
var AWALAN = 'rmm-';
var V = AWALAN + 'v4';
var SHELL = ['./', 'index.html', 'app-api.js', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(AWALAN) === 0 && k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(function (res) {
    var copy = res.clone();
    caches.open(V).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }); }));
});
