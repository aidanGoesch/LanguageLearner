import type { AppSettings, Card, StudyScope } from '../types';
import type { Stack } from '../types';

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function filterCardsByScope(cards: Card[], stacks: Stack[], scope: StudyScope): Card[] {
  if (scope.type === 'all') return cards;

  if (scope.type === 'stack') {
    return cards.filter((c) => c.stackId === scope.stackId);
  }

  if (scope.type === 'language') {
    const stackIds = new Set(
      stacks.filter((s) => s.language.toLowerCase() === scope.language.toLowerCase()).map((s) => s.id),
    );
    return cards.filter((c) => stackIds.has(c.stackId));
  }

  const allowed = new Set(scope.stackIds);
  return cards.filter((c) => allowed.has(c.stackId));
}

function interleave(reviews: Card[], news: Card[]): Card[] {
  const result: Card[] = [];
  let ri = 0;
  let ni = 0;
  while (ri < reviews.length || ni < news.length) {
    if (ri < reviews.length) result.push(reviews[ri++]);
    if (ni < news.length) result.push(news[ni++]);
  }
  return result;
}

export function countNewCardsStudiedToday(
  reviewLogs: { reviewedAt: number; previousState: string }[],
  now = Date.now(),
): number {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  return reviewLogs.filter(
    (l) => l.previousState === 'New' && l.reviewedAt >= dayStart && l.reviewedAt <= dayEnd,
  ).length;
}

export function buildQueue(
  cards: Card[],
  settings: AppSettings,
  newCardsStudiedToday: number,
  now = Date.now(),
): Card[] {
  const dueReviews = cards
    .filter((c) => c.state !== 'New' && c.due <= now)
    .sort((a, b) => a.due - b.due);

  const remainingNewBudget = Math.max(0, settings.newCardsPerDay - newCardsStudiedToday);
  const newCards = cards
    .filter((c) => c.state === 'New')
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, remainingNewBudget);

  return interleave(dueReviews, newCards);
}

export function countDueCards(cards: Card[], now = Date.now()): number {
  return cards.filter((c) => (c.state === 'New' || c.due <= now)).length;
}

export function countDueToday(cards: Card[], now = Date.now()): number {
  const dayEnd = endOfDay(now);
  return cards.filter((c) => c.state !== 'New' && c.due <= dayEnd).length;
}

export function countDueThisWeek(cards: Card[], now = Date.now()): number {
  const weekEnd = startOfDay(now) + 7 * 24 * 60 * 60 * 1000 - 1;
  return cards.filter((c) => c.state !== 'New' && c.due <= weekEnd).length;
}

export function forecastDue(cards: Card[], now = Date.now()): { tomorrow: number; thisWeek: number } {
  const tomorrowStart = startOfDay(now) + 24 * 60 * 60 * 1000;
  const tomorrowEnd = endOfDay(tomorrowStart);
  const weekEnd = startOfDay(now) + 7 * 24 * 60 * 60 * 1000 - 1;

  const tomorrow = cards.filter(
    (c) => c.state !== 'New' && c.due >= tomorrowStart && c.due <= tomorrowEnd,
  ).length;

  const thisWeek = cards.filter(
    (c) => c.state !== 'New' && c.due > endOfDay(now) && c.due <= weekEnd,
  ).length;

  return { tomorrow, thisWeek };
}

export function computeStreak(reviewLogs: { reviewedAt: number }[], now = Date.now()): number {
  if (reviewLogs.length === 0) return 0;

  const daysWithReviews = new Set<number>();
  for (const log of reviewLogs) {
    daysWithReviews.add(startOfDay(log.reviewedAt));
  }

  let streak = 0;
  let day = startOfDay(now);

  if (!daysWithReviews.has(day)) {
    day -= 24 * 60 * 60 * 1000;
  }

  while (daysWithReviews.has(day)) {
    streak++;
    day -= 24 * 60 * 60 * 1000;
  }

  return streak;
}

export function computeRetentionRate(
  reviewLogs: { rating: number; reviewedAt: number }[],
  days = 30,
  now = Date.now(),
): number | null {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const recent = reviewLogs.filter((l) => l.reviewedAt >= cutoff);
  if (recent.length === 0) return null;
  const remembered = recent.filter((l) => l.rating === 3 || l.rating === 4).length;
  return Math.round((remembered / recent.length) * 100);
}
