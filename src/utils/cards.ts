import { createEmptyCard } from 'ts-fsrs';
import { fromFsrsCard } from '../fsrs/mapping';
import type { Card } from '../types';

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
