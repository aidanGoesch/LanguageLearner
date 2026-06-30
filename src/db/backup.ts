import { createEmptyCard } from 'ts-fsrs';
import type { BackupData, Card, ImportMode, Stack } from '../types';
import { clearCards, getAllCards, putCards } from './cards';
import { clearReviewLogs, getAllReviewLogs, putReviewLogs } from './reviewLogs';
import { getSettings, updateSettings } from './settings';
import { clearStacks, getAllStacks, putStacks } from './stacks';
import { fromFsrsCard } from '../fsrs/mapping';

const BACKUP_VERSION = 1;

export async function exportAll(): Promise<BackupData> {
  const [stacks, cards, reviewLogs, settings] = await Promise.all([
    getAllStacks(),
    getAllCards(),
    getAllReviewLogs(),
    getSettings(),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    stacks,
    cards,
    reviewLogs,
    settings,
  };
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function createDefaultFsrsFields(now: number) {
  const empty = createEmptyCard(new Date(now));
  return fromFsrsCard(empty);
}

export async function importAll(data: BackupData, mode: ImportMode): Promise<{ stacks: number; cards: number; skipped: number }> {
  if (mode === 'overwrite') {
    await Promise.all([clearStacks(), clearCards(), clearReviewLogs()]);
    await putStacks(data.stacks);
    await putCards(data.cards);
    await putReviewLogs(data.reviewLogs);
    await updateSettings(data.settings);
    return { stacks: data.stacks.length, cards: data.cards.length, skipped: 0 };
  }

  const [existingStacks, existingCards] = await Promise.all([getAllStacks(), getAllCards()]);
  const stackByName = new Map(existingStacks.map((s) => [s.name.toLowerCase(), s]));
  const cardKey = (stackId: string, term: string) => `${stackId}::${term.toLowerCase().trim()}`;
  const existingCardKeys = new Set(existingCards.map((c) => cardKey(c.stackId, c.term)));

  const stackIdMap = new Map<string, string>();
  const mergedStacks: Stack[] = [...existingStacks];
  let newStackCount = 0;

  for (const imported of data.stacks) {
    const existing = stackByName.get(imported.name.toLowerCase());
    if (existing) {
      stackIdMap.set(imported.id, existing.id);
    } else {
      const newStack: Stack = { ...imported, id: crypto.randomUUID() };
      stackByName.set(newStack.name.toLowerCase(), newStack);
      stackIdMap.set(imported.id, newStack.id);
      mergedStacks.push(newStack);
      newStackCount++;
    }
  }

  const mergedCards: Card[] = [...existingCards];
  let newCardCount = 0;
  let skipped = 0;
  const now = Date.now();
  const defaults = createDefaultFsrsFields(now);

  for (const imported of data.cards) {
    const mappedStackId = stackIdMap.get(imported.stackId);
    if (!mappedStackId) {
      skipped++;
      continue;
    }
    const key = cardKey(mappedStackId, imported.term);
    if (existingCardKeys.has(key)) {
      skipped++;
      continue;
    }
    const card: Card = {
      ...defaults,
      ...imported,
      id: crypto.randomUUID(),
      stackId: mappedStackId,
      learning_steps: imported.learning_steps ?? defaults.learning_steps,
    };
    mergedCards.push(card);
    existingCardKeys.add(key);
    newCardCount++;
  }

  await putStacks(mergedStacks);
  await putCards(mergedCards);

  const existingLogIds = new Set((await getAllReviewLogs()).map((l) => l.id));
  const cardIdMap = new Map<string, string>();
  for (const imported of data.cards) {
    const mappedStackId = stackIdMap.get(imported.stackId);
    if (!mappedStackId) continue;
    const match = mergedCards.find(
      (c) => c.stackId === mappedStackId && c.term.toLowerCase().trim() === imported.term.toLowerCase().trim(),
    );
    if (match) cardIdMap.set(imported.id, match.id);
  }

  const newLogs = data.reviewLogs
    .filter((l) => !existingLogIds.has(l.id))
    .map((l) => {
      const mappedCardId = cardIdMap.get(l.cardId);
      if (!mappedCardId) return null;
      return { ...l, id: crypto.randomUUID(), cardId: mappedCardId };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (newLogs.length > 0) {
    const allLogs = [...(await getAllReviewLogs()), ...newLogs];
    await putReviewLogs(allLogs);
  }

  const currentSettings = await getSettings();
  await updateSettings({ ...currentSettings, ...data.settings });

  return { stacks: newStackCount, cards: newCardCount, skipped };
}
