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

  let current = creature;
  let evolved = false;
  let fromStage: CreatureStage | undefined;
  let toStage: CreatureStage | undefined;

  for (;;) {
    const idx = STAGE_ORDER.indexOf(current.stage);
    const nextStage = STAGE_ORDER[idx + 1];
    if (!nextStage) break;

    const xpNeeded = XP_TO_ADVANCE[current.stage];
    const streakNeeded = STREAK_GATE[nextStage];

    if (current.xpTowardNextStage < xpNeeded) break;
    if (profile.currentStreak < streakNeeded) break;

    if (!evolved) {
      fromStage = current.stage;
    }
    toStage = nextStage;
    evolved = true;

    current = {
      ...current,
      stage: nextStage,
      xpTowardNextStage: current.xpTowardNextStage - xpNeeded,
      happiness: Math.min(100, current.happiness + 25),
    };
  }

  return evolved
    ? { creature: current, evolved: true, fromStage, toStage }
    : { creature, evolved: false };
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
