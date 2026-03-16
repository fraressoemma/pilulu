const CACHE_NAME = 'pilu-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Handle notification scheduling from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { hour, minute } = event.data;
    scheduleNotification(hour, minute);
  }
});

// Notification scheduling logic
let notificationTimer = null;

function scheduleNotification(hour, minute) {
  if (notificationTimer) clearInterval(notificationTimer);

  let notifiedToday = false;

  notificationTimer = setInterval(() => {
    const now = new Date();
    const nowH = now.getHours();
    const nowM = now.getMinutes();

    if (nowH === hour && nowM === minute && !notifiedToday) {
      notifiedToday = true;
      self.registration.showNotification("N'oublie pas ta pilule ! 💊", {
        body: 'Il est temps de prendre ta pilule contraceptive 🌸',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: 'pill-reminder',
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }

    // Reset at midnight
    if (nowH === 0 && nowM === 0) notifiedToday = false;
  }, 30000); // Check every 30s
}

// Handle notification click: open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
