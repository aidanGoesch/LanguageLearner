import type { Creature, CreatureStatus, Profile } from '../types';
import {
  CRITICAL_DAYS_BEFORE_LEAVE,
  GRACE_DAYS,
  HAPPINESS_DECAY_PER_DAY,
  HUNGER_DECAY_PER_HOUR,
  HUNGER_THRESHOLDS,
} from './constants';
import { todayDateStr } from './streak';
import { createEggCreature } from '../db/creature';

function msPerDay() {
  return 24 * 60 * 60 * 1000;
}

function daysSince(ts: number, now: number): number {
  return (now - ts) / msPerDay();
}

function computeStatus(hunger: number, happiness: number): CreatureStatus {
  if (hunger <= HUNGER_THRESHOLDS.critical || happiness <= 15) return 'critical';
  if (hunger <= HUNGER_THRESHOLDS.sick || happiness <= 35) return 'sick';
  if (hunger <= HUNGER_THRESHOLDS.hungry || happiness <= 55) return 'hungry';
  return 'happy';
}

export function applyHungerDecay(creature: Creature, now = Date.now()): Creature {
  if (creature.status === 'gone') return creature;

  const hoursSinceFed = (now - creature.lastFedAt) / (1000 * 60 * 60);
  const hunger = Math.max(0, 100 - hoursSinceFed * HUNGER_DECAY_PER_HOUR);

  const daysSinceStudy = creature.lastFedAt ? daysSince(creature.lastFedAt, now) : 0;
  const happinessDecay = Math.floor(Math.max(0, daysSinceStudy - 0.5) * HAPPINESS_DECAY_PER_DAY);
  const happiness = Math.max(0, creature.happiness - happinessDecay);

  const status = computeStatus(hunger, happiness);
  return { ...creature, hunger, happiness, status };
}

export function feedCreature(creature: Creature, now = Date.now()): Creature {
  if (creature.status === 'gone') return creature;
  return {
    ...creature,
    hunger: 100,
    happiness: Math.min(100, creature.happiness + 18),
    status: 'happy',
    lastFedAt: now,
  };
}

export function addCreatureXp(creature: Creature, xp: number): Creature {
  if (creature.status === 'gone') return creature;
  return {
    ...creature,
    totalXp: creature.totalXp + xp,
    xpTowardNextStage: creature.xpTowardNextStage + xp,
    happiness: Math.min(100, creature.happiness + Math.floor(xp / 20)),
  };
}

export function bumpHappiness(creature: Creature, amount: number): Creature {
  if (creature.status === 'gone') return creature;
  const happiness = Math.min(100, creature.happiness + amount);
  const status = computeStatus(creature.hunger, happiness);
  return { ...creature, happiness, status };
}

/** Check if creature should leave after prolonged neglect. */
export function checkDeparture(creature: Creature, profile: Profile, now = Date.now()): Creature {
  if (creature.status === 'gone') return creature;

  const refreshed = applyHungerDecay(creature, now);
  if (refreshed.status !== 'critical') return refreshed;

  const lastStudy = profile.lastStudyDate;
  if (!lastStudy) return refreshed;

  const neglectedDays = daysSince(new Date(lastStudy + 'T12:00:00').getTime(), now);
  if (neglectedDays >= GRACE_DAYS + CRITICAL_DAYS_BEFORE_LEAVE) {
    return { ...refreshed, status: 'gone', happiness: 0, hunger: 0 };
  }
  return refreshed;
}

export function adoptCreature(name?: string): Creature {
  return createEggCreature(name?.trim() || 'Pip');
}

export function statusMessage(creature: Creature): string {
  switch (creature.status) {
    case 'happy':
      return creature.stage === 'egg' ? 'Warm and cozy in the shell.' : 'Feeling bright today.';
    case 'hungry':
      return 'A study snack would hit the spot.';
    case 'sick':
      return 'Needs some care — cards might help.';
    case 'critical':
      return 'Really hoping you stop by soon.';
    case 'gone':
      return 'Your companion wandered off… but a new egg waits.';
  }
}

export function stageLabel(stage: Creature['stage']): string {
  const labels: Record<Creature['stage'], string> = {
    egg: 'Egg',
    baby: 'Hatchling',
    juvenile: 'Sprout',
    adult: 'Guardian',
    elder: 'Sage',
  };
  return labels[stage];
}

export function daysSinceLastFed(creature: Creature, now = Date.now()): number {
  return daysSince(creature.lastFedAt, now);
}

export function lastStudyGapDays(profile: Profile, now = Date.now()): number {
  if (!profile.lastStudyDate) return 0;
  const today = todayDateStr(now);
  const gapMs = new Date(today + 'T12:00:00').getTime() - new Date(profile.lastStudyDate + 'T12:00:00').getTime();
  return Math.max(0, Math.round(gapMs / msPerDay()));
}
