/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
  ...build, // the app itself (JS/CSS bundles)
  ...files  // everything in `static`
];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => {
      sw.skipWaiting();
    })
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      // Delete old caches
      for (const key of keys) {
        if (key !== CACHE) await caches.delete(key);
      }
      sw.clients.claim();
    })
  );
});

sw.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Don't cache API routes — always go to network
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);

        // Cache successful responses for same-origin requests
        if (response.status === 200 && url.origin === self.location.origin) {
          cache.put(event.request, response.clone());
        }

        return response;
      } catch {
        // If offline and no cache, return a basic offline fallback
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});
