// Service Worker for Push Notifications

self.addEventListener('push', (event) => {
  console.log('Push event received');

  let title = 'TT Reminders';
  let body = 'You have a notification';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();

      // Handle iOS APNs-style payload (aps.alert)
      if (payload.aps && payload.aps.alert) {
        title = payload.aps.alert.title || title;
        body = payload.aps.alert.body || body;
      } else {
        // Handle standard web push payload
        title = payload.title || title;
        body = payload.body || body;
      }

      data = payload.data || {};
    } catch (e) {
      console.error('Error parsing push data:', e);
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: data
  };

  console.log('Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
