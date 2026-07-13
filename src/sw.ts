/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const SYNC_TAG = 'den-daily-reminder';

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

async function showDueReminder() {
  const data = await readReminderPayload();
  const count = data?.dueCount ?? 0;
  const body =
    count > 0
      ? `${count} card${count === 1 ? '' : 's'} are ready whenever you are.`
      : 'Your den is quiet — peek in when you like.';

  await self.registration.showNotification('Den — study nudge', {
    body,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: 'den-daily-reminder',
    data: { url: self.registration.scope },
  });
}

interface ReminderPayload {
  dueCount: number;
  scheduledHour: number;
}

async function readReminderPayload(): Promise<ReminderPayload | null> {
  const cache = await caches.open('den-reminder');
  const res = await cache.match('/den-reminder.json');
  if (!res) return null;
  try {
    return (await res.json()) as ReminderPayload;
  } catch {
    return null;
  }
}

self.addEventListener('periodicsync', (event) => {
  const ev = event as ExtendableEvent & { tag: string };
  if (ev.tag === SYNC_TAG) {
    ev.waitUntil(showDueReminder());
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(showDueReminder());
});
