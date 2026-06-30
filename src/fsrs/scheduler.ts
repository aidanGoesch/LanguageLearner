import { createEmptyCard, fsrs, type IFSRS } from 'ts-fsrs';
import type { AppSettings } from '../types';

export function createScheduler(settings: AppSettings): IFSRS {
  return fsrs({
    request_retention: settings.requestRetention,
    enable_fuzz: true,
    enable_short_term: true,
  });
}

export function createNewCardFsrsFields(now = Date.now()) {
  return createEmptyCard(new Date(now));
}

export { createEmptyCard };
