import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings, Card, ReviewLog, Stack } from '../types';

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
}

const DB_NAME = 'flashcards';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FlashcardDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<FlashcardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FlashcardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
      },
    });
  }
  return dbPromise;
}
