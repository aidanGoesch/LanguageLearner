import type { Stack } from '../types';
import { getDb } from './schema';

export async function getAllStacks(): Promise<Stack[]> {
  const db = await getDb();
  return db.getAll('stacks');
}

export async function getStack(id: string): Promise<Stack | undefined> {
  const db = await getDb();
  return db.get('stacks', id);
}

export async function createStack(data: Omit<Stack, 'id' | 'createdAt'>): Promise<Stack> {
  const db = await getDb();
  const stack: Stack = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...data,
  };
  await db.put('stacks', stack);
  return stack;
}

export async function updateStack(stack: Stack): Promise<void> {
  const db = await getDb();
  await db.put('stacks', stack);
}

export async function deleteStack(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('stacks', id);
}

export async function putStacks(stacks: Stack[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('stacks', 'readwrite');
  await Promise.all(stacks.map((s) => tx.store.put(s)));
  await tx.done;
}

export async function clearStacks(): Promise<void> {
  const db = await getDb();
  await db.clear('stacks');
}
