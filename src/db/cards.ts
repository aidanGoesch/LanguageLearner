import type { Card } from '../types';
import { getDb } from './schema';

export async function getAllCards(): Promise<Card[]> {
  const db = await getDb();
  return db.getAll('cards');
}

export async function getCard(id: string): Promise<Card | undefined> {
  const db = await getDb();
  return db.get('cards', id);
}

export async function getCardsByStack(stackId: string): Promise<Card[]> {
  const db = await getDb();
  return db.getAllFromIndex('cards', 'stackId', stackId);
}

export async function createCard(data: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
  const db = await getDb();
  const card: Card = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...data,
  };
  await db.put('cards', card);
  return card;
}

export async function updateCard(card: Card): Promise<void> {
  const db = await getDb();
  await db.put('cards', card);
}

export async function deleteCard(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('cards', id);
}

export async function deleteCardsByStack(stackId: string): Promise<void> {
  const db = await getDb();
  const cards = await db.getAllFromIndex('cards', 'stackId', stackId);
  const tx = db.transaction('cards', 'readwrite');
  await Promise.all(cards.map((c) => tx.store.delete(c.id)));
  await tx.done;
}

export async function putCards(cards: Card[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('cards', 'readwrite');
  await Promise.all(cards.map((c) => tx.store.put(c)));
  await tx.done;
}

export async function clearCards(): Promise<void> {
  const db = await getDb();
  await db.clear('cards');
}
