// Service Worker — scheduled daily notifications

let _timer = null;

self.addEventListener('message', (event) => {
  const { type, delay, title, body } = event.data || {};
  if (type !== 'SCHEDULE_NOTIFICATION') return;

  if (_timer) clearTimeout(_timer);
  if (!delay || delay < 0) return;

  _timer = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      tag: 'jrpg-daily',
      requireInteraction: false,
      data: { url: self.location.origin }
    });
  }, delay);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return clients.openWindow(event.notification.data?.url || self.location.origin);
    })
  );
});
