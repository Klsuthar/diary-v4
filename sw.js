// sw.js - Service Worker

// --- Cache Configuration ---
const APP_SHELL_CACHE_NAME = 'my-personal-diary-static-v35';
const DYNAMIC_CACHE_NAME = 'my-personal-diary-dynamic-v35';
const FONTS_CACHE_NAME = 'my-personal-diary-fonts-v35';
const IMAGES_CACHE_NAME = 'my-personal-diary-images-v35';

// Cache size limits
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGES_CACHE_SIZE = 20;

const BASE_PATH = '/diary-v4';

const APP_SHELL_ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/settings.html`,
    `${BASE_PATH}/css/style.css`,
    `${BASE_PATH}/css/settings.css`,
    `${BASE_PATH}/js/script.js`,
    `${BASE_PATH}/js/settings.js`,
    `${BASE_PATH}/images/logo.ico`,
    `${BASE_PATH}/images/logo.png`,
    `${BASE_PATH}/images/logo16.png`,
    `${BASE_PATH}/images/logo32.png`,
    `${BASE_PATH}/images/logo64.png`,
    `${BASE_PATH}/images/logo256.png`,
    `${BASE_PATH}/images/logo512.png`
];

const EXTERNAL_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap'
];

// Utility function to limit cache size
const limitCacheSize = (cacheName, maxSize) => {
    caches.open(cacheName).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > maxSize) {
                cache.delete(keys[0]).then(() => limitCacheSize(cacheName, maxSize));
            }
        });
    });
};

// --- Service Worker Lifecycle Events ---

/**
 * Install Event:
 * Caches the core application shell assets. This runs once when the service worker is installed or updated.
 */
self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        Promise.all([
            // Cache app shell
            caches.open(APP_SHELL_CACHE_NAME).then(cache => {
                console.log('[Service Worker] Caching App Shell');
                const requests = APP_SHELL_ASSETS.map(url => new Request(url, { cache: 'reload' }));
                return cache.addAll(requests);
            }),
            // Cache external fonts and CSS
            caches.open(FONTS_CACHE_NAME).then(cache => {
                console.log('[Service Worker] Caching External Assets');
                return cache.addAll(EXTERNAL_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
        ]).then(() => {
            console.log('[Service Worker] All assets cached successfully');
            return self.skipWaiting();
        }).catch(error => {
            console.error('[Service Worker] Failed to cache assets during install:', error);
        })
    );
});

/**
 * Activate Event:
 * Cleans up old caches to remove outdated assets and free up storage.
 */
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete any caches that are not the current static or dynamic caches
                    if (cacheName !== APP_SHELL_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Old caches cleaned up.');
            // Take control of all open clients (pages) without requiring a reload.
            return self.clients.claim();
        })
    );
});

// --- Fetch Event: The Core of Offline Functionality ---

/**
 * Fetch Event:
 * Intercepts all network requests made by the application and applies caching strategies.
 */
self.addEventListener('fetch', event => {
    const { request } = event;

    // For navigation requests (e.g., loading the HTML page), use a "Network Falling Back to Cache" strategy.
    // This ensures users get the latest version of the app if they are online,
    // but still allows the app to load from the cache if they are offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // If the network request fails (e.g., user is offline), serve the main index.html from the cache.
                    console.log('[Service Worker] Navigation fetch failed. Serving offline fallback from cache.');
                    return caches.match(`${BASE_PATH}/index.html`).then(response => {
                        return response || caches.match(`${BASE_PATH}/`);
                    });
                })
        );
        return;
    }

    // For all other requests (CSS, JS, fonts, images), use a "Cache First, Falling Back to Network" strategy.
    // This is ideal for static assets as it serves them instantly from the cache if available.
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // If the asset is in the cache, return it immediately.
                    return cachedResponse;
                }
                // If the asset is not in the cache, fetch it from the network.
                return fetch(request).then(networkResponse => {
                    // Optional: Add the newly fetched asset to the dynamic cache for future offline use.
                    if (networkResponse && networkResponse.status === 200) {
                        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                            cache.put(request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(error => {
                console.error('[Service Worker] Fetch failed:', error);
                if (request.destination === 'image') {
                    return caches.match('images/logo256.png');
                }
            })
    );
});

// Background sync for data persistence
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync:', event.tag);
    if (event.tag === 'diary-backup') {
        event.waitUntil(performBackgroundBackup());
    }
});

// Push notification support
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received');
    const options = {
        body: event.data ? event.data.text() : 'Time to update your diary!',
        icon: 'images/logo256.png',
        badge: 'images/logo64.png',
        vibrate: [200, 100, 200],
        data: { url: `${BASE_PATH}/` },
        actions: [
            { action: 'open', title: 'Open Diary', icon: 'images/logo32.png' },
            { action: 'close', title: 'Close', icon: 'images/logo32.png' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('My Personal Diary', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(`${BASE_PATH}/`)
        );
    }
});

// Helper function for background backup
async function performBackgroundBackup() {
    try {
        console.log('[Service Worker] Performing background backup');
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] Background backup failed:', error);
        return Promise.reject(error);
    }
}