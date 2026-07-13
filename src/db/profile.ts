import type { Profile } from '../types';
import { getDb } from './schema';

export const PROFILE_KEY = 'profile';

export const DEFAULT_PROFILE: Profile = {
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  freezesAvailable: 0,
  lastFreezeAccrualDate: '',
  coins: 0,
  ownedCosmetics: ['skin-default', 'bg-nest'],
  totalReviews: 0,
  usageHours: Array.from({ length: 24 }, () => 0),
  notificationsEnabled: false,
  notificationHour: 18,
  adaptiveNotificationTime: true,
  soundEnabled: true,
  hapticsEnabled: true,
};

type ProfileRecord = Profile & { id: string };

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  const stored = (await db.get('profile', PROFILE_KEY)) as ProfileRecord | undefined;
  if (stored) {
    const { id: _id, ...profile } = stored;
    return { ...DEFAULT_PROFILE, ...profile };
  }
  const fresh: Profile = { ...DEFAULT_PROFILE, usageHours: Array.from({ length: 24 }, () => 0) };
  await db.put('profile', { id: PROFILE_KEY, ...fresh });
  return fresh;
}

export async function updateProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  await db.put('profile', { id: PROFILE_KEY, ...profile });
}

/** @deprecated use updateProfile */
export const saveProfile = updateProfile;
