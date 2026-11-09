// Hand-written service worker: caches the app shell and built assets so the app opens offline.
// API responses are never cached, so nobody's private data is left on a shared device.
const CACHE = "second-brain-v1";
const SHELL = ["/", "/favicon.svg", "/manifest.webmanifest", "/pwa-192.png", "/pwa-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function fromNetwork(request, fallback) {
  try {
    const res = await fetch(request);
    if (res.ok) void (await caches.open(CACHE)).put(fallback ?? request, res.clone());
    return res;
  } catch {
    return (await caches.match(fallback ?? request)) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Pages: network first, so a new deploy shows up at once; the cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(fromNetwork(request, "/"));
    return;
  }
  // Built files have a content hash in their name, so a cached copy is always right.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fromNetwork(request)));
    return;
  }
  event.respondWith(fromNetwork(request));
});
