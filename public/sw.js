const CACHE_NAME = 'sips-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/branding/sips-mark.png',
  '/branding/sips-logo-mark.png',
  '/branding/sips-logo-full.png',
  '/branding/sips-logo-compact.png',
  '/icons.svg',
  '/vite.svg',
  '/react.svg',
  '/hero.png'
];

const API_CACHE_NAME = 'sips-api-v1';
const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'stale-while-revalidate',
  images: 'cache-first'
};

const API_PATHS = [
  '/api/',
  '/api/interviews/'
];

const EXCLUDE_FROM_CACHE = [
  '/api/auth/',
  '/api/interviews/session',
  '/api/interviews/config-status'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin && !url.href.includes('fonts.googleapis.com') && !url.href.includes('fonts.gstatic.com')) {
    return;
  }

  const isStaticAsset = STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/assets/'));
  const isApiRequest = API_PATHS.some(path => url.pathname.startsWith(path));
  const isExcluded = EXCLUDE_FROM_CACHE.some(path => url.pathname.startsWith(path));
  const isImage = request.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/i.test(url.pathname);

  if (isExcluded) {
    return;
  }

  if (isStaticAsset || isImage) {
    event.respondWith(cacheFirst(request, isImage ? CACHE_NAME : CACHE_NAME));
    return;
  }

  if (isApiRequest) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAME));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});