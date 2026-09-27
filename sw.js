/* Legacy Service Worker intentionally disabled. The game now uses WebView HTTP disk cache. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.registration.unregister().catch(() => {})));
