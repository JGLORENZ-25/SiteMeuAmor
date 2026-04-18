/* Service worker — PWA (cache + requisitos de instalação) */
var CACHE_NAME = "nosso-tempo-v8";

function basePath() {
  return new URL(".", self.location.href).href;
}

function urlJoin(name) {
  return new URL(name, basePath()).href;
}

var PRECACHE_URLS = [
  "index.html",
  "manifest.json",
  "service-worker.js",
  "logo.png",
  "foto1.png",
  "foto2.png",
  "foto3.png",
  "foto4.png",
  "foto5.png",
  "foto6.png"
].map(function (name) {
  return urlJoin(name);
});

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
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function matchIndex(cache) {
  return cache.match(urlJoin("index.html"));
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") {
    return;
  }
  var url = new URL(req.url);
  if (!isSameOrigin(url)) {
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(req, copy);
            });
          }
          return res;
        })
        .catch(function () {
          if (req.mode === "navigate") {
            return caches.open(CACHE_NAME).then(matchIndex);
          }
          return Promise.reject(new Error("offline"));
        });
    })
  );
});
