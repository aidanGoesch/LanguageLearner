import type { CreatureStage } from '../types';

export const APP_NAME = 'Den';
export const SPECIES = 'emberling';

export const STAGE_ORDER: CreatureStage[] = ['egg', 'baby', 'juvenile', 'adult', 'elder'];

export const XP_TO_ADVANCE: Record<CreatureStage, number> = {
  egg: 40,
  baby: 120,
  juvenile: 300,
  adult: 600,
  elder: Infinity,
};

/** Minimum streak days required to evolve past each stage. */
export const STREAK_GATE: Record<CreatureStage, number> = {
  egg: 0,
  baby: 0,
  juvenile: 3,
  adult: 7,
  elder: 30,
};

export const BASE_XP = { forgot: 3, struggled: 10, easy: 14 } as const;

export const COIN_RATIO = 0.45;
export const COMBO_MAX = 12;
export const COMBO_STEP = 0.08;

export const HUNGER_DECAY_PER_HOUR = 1.8;
export const HUNGER_THRESHOLDS = { hungry: 65, sick: 35, critical: 12 } as const;
export const HAPPINESS_DECAY_PER_DAY = 8;
export const GRACE_DAYS = 3;
export const CRITICAL_DAYS_BEFORE_LEAVE = 3;

export const FREEZE_ACCRUAL_INTERVAL_DAYS = 4;
export const MAX_FREEZES = 3;

export const VARIABLE_REWARD_CHANCE = 1 / 8;
export const BONUS_COIN_RANGE = [8, 24] as const;

export const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;
