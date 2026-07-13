import type { Profile } from '../types';
import {
  FREEZE_ACCRUAL_INTERVAL_DAYS,
  MAX_FREEZES,
  STREAK_MILESTONES,
} from './constants';

export function todayDateStr(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00').getTime();
  const db = new Date(b + 'T12:00:00').getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

function yesterdayStr(now = Date.now()): string {
  return todayDateStr(now - 24 * 60 * 60 * 1000);
}

/** Apply missed-day freeze consumption before starting a session. */
export function reconcileStreak(profile: Profile, now = Date.now()): Profile {
  const today = todayDateStr(now);
  if (!profile.lastStudyDate || profile.lastStudyDate === today) return profile;

  const gap = daysBetween(profile.lastStudyDate, today);
  if (gap <= 1) return profile;

  let freezes = profile.freezesAvailable;
  let streak = profile.currentStreak;
  let cursor = profile.lastStudyDate;

  for (let i = 1; i < gap; i++) {
    const missedDay = new Date(new Date(cursor + 'T12:00:00').getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    if (freezes > 0) {
      freezes--;
    } else {
      streak = 0;
    }
    cursor = missedDay;
  }

  return { ...profile, currentStreak: streak, freezesAvailable: freezes };
}

export function accrueFreezes(profile: Profile, now = Date.now()): Profile {
  const today = todayDateStr(now);
  if (profile.currentStreak < 1) return profile;

  const anchor = profile.lastFreezeAccrualDate || profile.lastStudyDate || today;
  const elapsed = daysBetween(anchor, today);
  if (elapsed < FREEZE_ACCRUAL_INTERVAL_DAYS) return profile;

  const earned = Math.floor(elapsed / FREEZE_ACCRUAL_INTERVAL_DAYS);
  const freezes = Math.min(MAX_FREEZES, profile.freezesAvailable + earned);
  const advancedDays = earned * FREEZE_ACCRUAL_INTERVAL_DAYS;
  const newAnchor = new Date(new Date(anchor + 'T12:00:00').getTime() + advancedDays * 86400000)
    .toISOString()
    .slice(0, 10);

  return { ...profile, freezesAvailable: freezes, lastFreezeAccrualDate: newAnchor };
}

/** Call when today's due queue is fully cleared. */
export function completeStudyDay(profile: Profile, now = Date.now()): Profile {
  const today = todayDateStr(now);
  if (profile.lastStudyDate === today) return accrueFreezes(profile, now);

  const continued =
    profile.lastStudyDate === yesterdayStr(now) || profile.lastStudyDate === '';
  const streak = continued ? profile.currentStreak + 1 : 1;

  const updated: Profile = {
    ...profile,
    currentStreak: streak,
    longestStreak: Math.max(profile.longestStreak, streak),
    lastStudyDate: today,
    lastFreezeAccrualDate: profile.lastFreezeAccrualDate || today,
  };
  return accrueFreezes(updated, now);
}

export function detectStreakMilestone(streak: number): number | null {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (streak === STREAK_MILESTONES[i]) return STREAK_MILESTONES[i];
  }
  return null;
}

export function trackUsageHour(profile: Profile, now = Date.now()): Profile {
  const hour = new Date(now).getHours();
  const usageHours = [...profile.usageHours];
  usageHours[hour] += 1;
  return { ...profile, usageHours };
}

export function preferredNotificationHour(profile: Profile): number {
  if (!profile.adaptiveNotificationTime) return profile.notificationHour;
  let bestHour = profile.notificationHour;
  let bestCount = -1;
  profile.usageHours.forEach((count, hour) => {
    if (count > bestCount) {
      bestCount = count;
      bestHour = hour;
    }
  });
  return bestCount > 0 ? bestHour : profile.notificationHour;
}
