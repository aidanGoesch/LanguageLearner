import type { Creature, CreatureStage, Profile } from '../types';
import { STAGE_ORDER, STREAK_GATE, XP_TO_ADVANCE } from './constants';

export interface EvolutionResult {
  creature: Creature;
  evolved: boolean;
  fromStage?: CreatureStage;
  toStage?: CreatureStage;
}

export function checkEvolution(creature: Creature, profile: Profile): EvolutionResult {
  if (creature.status === 'gone' || creature.stage === 'elder') {
    return { creature, evolved: false };
  }

  const idx = STAGE_ORDER.indexOf(creature.stage);
  const nextStage = STAGE_ORDER[idx + 1];
  if (!nextStage) return { creature, evolved: false };

  const xpNeeded = XP_TO_ADVANCE[creature.stage];
  const streakNeeded = STREAK_GATE[nextStage];

  if (creature.xpTowardNextStage < xpNeeded) {
    return { creature, evolved: false };
  }
  if (profile.currentStreak < streakNeeded) {
    return { creature, evolved: false };
  }

  const evolvedCreature: Creature = {
    ...creature,
    stage: nextStage,
    xpTowardNextStage: creature.xpTowardNextStage - xpNeeded,
    happiness: Math.min(100, creature.happiness + 25),
  };

  return {
    creature: evolvedCreature,
    evolved: true,
    fromStage: creature.stage,
    toStage: nextStage,
  };
}

export function xpProgress(creature: Creature): { current: number; needed: number; ratio: number } {
  const needed = XP_TO_ADVANCE[creature.stage];
  if (!Number.isFinite(needed)) {
    return { current: creature.xpTowardNextStage, needed: 0, ratio: 1 };
  }
  return {
    current: creature.xpTowardNextStage,
    needed,
    ratio: Math.min(1, creature.xpTowardNextStage / needed),
  };
}

export function streakGateForNext(creature: Creature): number | null {
  const idx = STAGE_ORDER.indexOf(creature.stage);
  const nextStage = STAGE_ORDER[idx + 1];
  if (!nextStage) return null;
  return STREAK_GATE[nextStage];
}
