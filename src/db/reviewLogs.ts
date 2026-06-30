import type { ReviewLog } from '../types';
import { getDb } from './schema';

export async function getAllReviewLogs(): Promise<ReviewLog[]> {
  const db = await getDb();
  return db.getAll('reviewLogs');
}

export async function getReviewLogsByCard(cardId: string): Promise<ReviewLog[]> {
  const db = await getDb();
  return db.getAllFromIndex('reviewLogs', 'cardId', cardId);
}

export async function addReviewLog(log: ReviewLog): Promise<void> {
  const db = await getDb();
  await db.put('reviewLogs', log);
}

export async function putReviewLogs(logs: ReviewLog[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('reviewLogs', 'readwrite');
  await Promise.all(logs.map((l) => tx.store.put(l)));
  await tx.done;
}

export async function clearReviewLogs(): Promise<void> {
  const db = await getDb();
  await db.clear('reviewLogs');
}

export async function deleteReviewLogsByCardIds(cardIds: string[]): Promise<void> {
  const db = await getDb();
  const idSet = new Set(cardIds);
  const all = await db.getAll('reviewLogs');
  const tx = db.transaction('reviewLogs', 'readwrite');
  await Promise.all(
    all.filter((l) => idSet.has(l.cardId)).map((l) => tx.store.delete(l.id)),
  );
  await tx.done;
}
