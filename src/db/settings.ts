import type { AppSettings } from '../types';
import { getDb } from './schema';

export const DEFAULT_SETTINGS: AppSettings = {
  newCardsPerDay: 15,
  requestRetention: 0.9,
};

const SETTINGS_KEY = 'app';

type SettingsRecord = AppSettings & { id: string };

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const stored = (await db.get('settings', SETTINGS_KEY)) as SettingsRecord | undefined;
  return stored ? { newCardsPerDay: stored.newCardsPerDay, requestRetention: stored.requestRetention } : { ...DEFAULT_SETTINGS };
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', { id: SETTINGS_KEY, ...settings });
}
