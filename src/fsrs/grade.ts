import type { Card, Grade, ReviewLog } from '../types';
import type { AppSettings } from '../types';
import { fromFsrsCard, mapGradeToFsrsRating, toFsrsCard } from './mapping';
import { createScheduler } from './scheduler';

export function gradeCard(
  card: Card,
  grade: Grade,
  settings: AppSettings,
  now = Date.now(),
): { card: Card; log: ReviewLog } {
  const scheduler = createScheduler(settings);
  const previousState = card.state;
  const fsrsCard = toFsrsCard(card);
  const rating = mapGradeToFsrsRating(grade);
  const result = scheduler.next(fsrsCard, new Date(now), rating);
  const updatedFields = fromFsrsCard(result.card);

  const updatedCard: Card = {
    ...card,
    ...updatedFields,
  };

  const log: ReviewLog = {
    id: crypto.randomUUID(),
    cardId: card.id,
    rating: rating as 1 | 2 | 3 | 4,
    reviewedAt: now,
    previousState,
  };

  return { card: updatedCard, log };
}
