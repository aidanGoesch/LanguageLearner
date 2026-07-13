import type { Card, Grade } from '../types';
import { BASE_XP, COIN_RATIO, COMBO_MAX, COMBO_STEP } from './constants';

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, COMBO_MAX) * COMBO_STEP;
}

export function xpForReview(card: Card, grade: Grade, combo: number): number {
  const base = BASE_XP[grade];
  if (grade === 'forgot') return base;

  const stabilityFactor =
    card.stability < 1 ? 1.6 : card.stability < 4 ? 1.35 : card.stability < 14 ? 1.15 : 1;
  const stateFactor =
    card.state === 'Relearning' ? 1.25 : card.state === 'Learning' ? 1.1 : card.state === 'New' ? 1.05 : 1;

  return Math.max(1, Math.round(base * stabilityFactor * stateFactor * comboMultiplier(combo)));
}

export function coinsFromXp(xp: number): number {
  return Math.max(0, Math.floor(xp * COIN_RATIO));
}

export function shouldResetCombo(grade: Grade): boolean {
  return grade === 'forgot';
}
