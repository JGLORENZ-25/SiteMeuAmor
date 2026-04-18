/* Service worker — cache básico para uso offline (PWA) */
var CACHE_NAME = "nosso-tempo-v2";

var PRECACHE_URLS = [
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./foto1.png",
  "./foto2.png",
  "./foto3.png",
  "./foto4.png",
  "./foto5.png",
  "./foto6.png"
];

function precacheOne(cache, url) {
  return cache.add(url).catch(function () {});
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(PRECACHE_URLS.map(function (u) {
        return precacheOne(cache, u);
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") {
    return;
  }
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(req)
        .then(function (res) {
          if (!res || res.status !== 200 || res.type !== "basic") {
            return res;
          }
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, copy);
          });
          return res;
        })
        .catch(function () {
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
          return Promise.reject(new Error("offline"));
        });
    })
  );
});
