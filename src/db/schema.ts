import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { normalizeLanguage } from '../data/languages';
import type { AppSettings, Card, Creature, Profile, ReviewLog, Stack } from '../types';
import { createEggCreature } from './creature';
import { DEFAULT_PROFILE, PROFILE_KEY } from './profile';

export interface FlashcardDB extends DBSchema {
  stacks: {
    key: string;
    value: Stack;
  };
  cards: {
    key: string;
    value: Card;
    indexes: { stackId: string; due: number; state: string };
  };
  reviewLogs: {
    key: string;
    value: ReviewLog;
    indexes: { cardId: string; reviewedAt: number };
  };
  settings: {
    key: string;
    value: AppSettings & { id: string };
  };
  creature: {
    key: string;
    value: Creature;
  };
  profile: {
    key: string;
    value: Profile & { id: string };
  };
}

const DB_NAME = 'flashcards';
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<FlashcardDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<FlashcardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FlashcardDB>(DB_NAME, DB_VERSION, {
      upgrade: async (db, oldVersion, _newVersion, tx) => {
        if (!db.objectStoreNames.contains('stacks')) {
          db.createObjectStore('stacks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cards')) {
          const cards = db.createObjectStore('cards', { keyPath: 'id' });
          cards.createIndex('stackId', 'stackId');
          cards.createIndex('due', 'due');
          cards.createIndex('state', 'state');
        }
        if (!db.objectStoreNames.contains('reviewLogs')) {
          const logs = db.createObjectStore('reviewLogs', { keyPath: 'id' });
          logs.createIndex('cardId', 'cardId');
          logs.createIndex('reviewedAt', 'reviewedAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('creature')) {
          db.createObjectStore('creature', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }

        if (oldVersion < 2) {
          const store = tx.objectStore('stacks');
          let cursor = await store.openCursor();
          while (cursor) {
            const stack = cursor.value;
            const canonical = normalizeLanguage(stack.language);
            if (canonical !== stack.language) {
              await cursor.update({ ...stack, language: canonical });
            }
            cursor = await cursor.continue();
          }
        }

        if (oldVersion < 3) {
          const creatureStore = tx.objectStore('creature');
          if ((await creatureStore.count()) === 0) {
            await creatureStore.put(createEggCreature());
          }
          const profileStore = tx.objectStore('profile');
          if ((await profileStore.count()) === 0) {
            await profileStore.put({ id: PROFILE_KEY, ...DEFAULT_PROFILE });
          }
        }

        if (oldVersion < 4) {
          const creatureStore = tx.objectStore('creature');
          let cursor = await creatureStore.openCursor();
          while (cursor) {
            const creature = cursor.value;
            if (!creature.cosmetics.background) {
              await cursor.update({
                ...creature,
                cosmetics: { ...creature.cosmetics, background: 'bg-nest' },
              });
            }
            cursor = await cursor.continue();
          }

          const profileStore = tx.objectStore('profile');
          let profileCursor = await profileStore.openCursor();
          while (profileCursor) {
            const record = profileCursor.value;
            const owned = record.ownedCosmetics ?? [];
            if (!owned.includes('bg-nest')) {
              await profileCursor.update({
                ...record,
                ownedCosmetics: [...owned, 'bg-nest'],
              });
            }
            profileCursor = await profileCursor.continue();
          }
        }
      },
    });
  }
  return dbPromise;
}
