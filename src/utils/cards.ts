import { createEmptyCard } from 'ts-fsrs';
import { fromFsrsCard } from '../fsrs/mapping';
import type { Card, CardState } from '../types';

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatDue(due: number, state: CardState, now = Date.now()): string {
  if (state === 'New') return 'New';

  const msUntil = due - now;

  if (msUntil <= 0) {
    const overdueMs = now - due;
    const overdueDays = Math.floor(overdueMs / (24 * 60 * 60 * 1000));
    if (overdueDays >= 1) return `Overdue ${overdueDays}d`;
    const overdueHours = Math.floor(overdueMs / (60 * 60 * 1000));
    if (overdueHours >= 1) return `Overdue ${overdueHours}h`;
    const overdueMinutes = Math.max(1, Math.floor(overdueMs / (60 * 1000)));
    return `Overdue ${overdueMinutes}m`;
  }

  const minutesUntil = msUntil / (60 * 1000);
  const hoursUntil = msUntil / (60 * 60 * 1000);

  if (minutesUntil < 60) {
    const m = Math.max(1, Math.ceil(minutesUntil));
    return m === 1 ? 'Due in 1m' : `Due in ${m}m`;
  }

  if (hoursUntil < 24) {
    const h = Math.ceil(hoursUntil);
    return h === 1 ? 'Due in 1h' : `Due in ${h}h`;
  }

  const dueDayStart = startOfDay(due);
  const todayStart = startOfDay(now);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const dayAfterTomorrow = todayStart + 2 * 24 * 60 * 60 * 1000;

  if (dueDayStart === tomorrowStart) return 'Due tomorrow';
  if (dueDayStart === dayAfterTomorrow) return 'Due in 2d';

  const daysUntil = Math.ceil((dueDayStart - todayStart) / (24 * 60 * 60 * 1000));
  return `Due in ${daysUntil}d`;
}

export function createNewCardFields(
  stackId: string,
  term: string,
  definition: string,
  now = Date.now(),
): Omit<Card, 'id' | 'createdAt'> {
  const fsrsFields = fromFsrsCard(createEmptyCard(new Date(now)));
  return {
    stackId,
    term: term.trim(),
    definition: definition.trim(),
    ...fsrsFields,
  };
}
