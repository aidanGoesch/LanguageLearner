import type { Creature } from '../types';
import { getDb } from './schema';

const CREATURE_KEY = 'companion';

export function createEggCreature(name = 'Pip'): Creature {
  return {
    id: CREATURE_KEY,
    name,
    species: 'emberling',
    adoptedAt: Date.now(),
    stage: 'egg',
    xpTowardNextStage: 0,
    totalXp: 0,
    hunger: 100,
    happiness: 75,
    status: 'happy',
    lastFedAt: Date.now(),
    cosmetics: { skin: 'skin-default', accessories: [], background: 'bg-nest' },
  };
}

export async function getCreature(): Promise<Creature> {
  const db = await getDb();
  const stored = await db.get('creature', CREATURE_KEY);
  return stored ?? createEggCreature();
}

export async function updateCreature(creature: Creature): Promise<void> {
  const db = await getDb();
  await db.put('creature', creature);
}

/** @deprecated use updateCreature */
export const saveCreature = updateCreature;
