import { countReadyToStudy } from '../fsrs/queue';
import { getAllCards, getAllReviewLogs, getProfile, getSettings } from '../db';
import { preferredNotificationHour } from './streak';

const SYNC_TAG = 'den-daily-reminder';
const REMINDER_CACHE = 'den-reminder';
const REMINDER_URL = '/den-reminder.json';

let timer: ReturnType<typeof setTimeout> | null = null;

async function writeReminderPayload(dueCount: number, scheduledHour: number) {
  const cache = await caches.open(REMINDER_CACHE);
  const body = JSON.stringify({ dueCount, scheduledHour, updatedAt: Date.now() });
  await cache.put(REMINDER_URL, new Response(body, { headers: { 'Content-Type': 'application/json' } }));
}

async function computeDueCount(): Promise<number> {
  const [cards, logs, settings] = await Promise.all([getAllCards(), getAllReviewLogs(), getSettings()]);
  const newToday = logs.filter(
    (l) => l.previousState === 'New' && l.reviewedAt >= startOfDay(Date.now()),
  ).length;
  return countReadyToStudy(cards, settings, newToday);
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function refreshReminderPayload(): Promise<void> {
  const profile = await getProfile();
  if (!profile.notificationsEnabled) return;
  const dueCount = await computeDueCount();
  await writeReminderPayload(dueCount, preferredNotificationHour(profile));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function registerPeriodicReminder(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const periodic = reg as ServiceWorkerRegistration & {
    periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
  };
  if (!periodic.periodicSync) return false;
  try {
    await periodic.periodicSync.register(SYNC_TAG, { minInterval: 24 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

function msUntilNextHour(hour: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export async function scheduleForegroundReminder(): Promise<void> {
  if (timer) clearTimeout(timer);
  const profile = await getProfile();
  if (!profile.notificationsEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  await refreshReminderPayload();
  const hour = preferredNotificationHour(profile);
  const delay = msUntilNextHour(hour);

  timer = setTimeout(async () => {
    const dueCount = await computeDueCount();
    const body =
      dueCount > 0
        ? `${dueCount} card${dueCount === 1 ? '' : 's'} are ready whenever you are.`
        : 'Your den is quiet — peek in when you like.';
    new Notification('Den — study nudge', { body, icon: '/pwa-192.png', tag: 'den-daily-reminder' });
    await scheduleForegroundReminder();
  }, delay);
}

export async function enableNotifications(): Promise<{ ok: boolean; periodic: boolean; message: string }> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { ok: false, periodic: false, message: 'Notifications blocked in browser settings.' };
  }
  await refreshReminderPayload();
  const periodic = await registerPeriodicReminder();
  await scheduleForegroundReminder();
  const message = periodic
    ? 'Daily nudge enabled (background sync where supported).'
    : 'Daily nudge enabled (foreground fallback — keep app installed for best results).';
  return { ok: true, periodic, message };
}

export async function disableNotifications(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export function notificationSupportHint(): string {
  const parts: string[] = [];
  if (!('Notification' in window)) parts.push('This browser does not support notifications.');
  if (!('serviceWorker' in navigator)) parts.push('Service worker unavailable.');
  parts.push(
    'Reminders are client-only: no server push. Chromium PWAs may use periodic background sync; otherwise a foreground timer is used when the app is open.',
  );
  return parts.join(' ');
}
