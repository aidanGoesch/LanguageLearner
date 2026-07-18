import { useMemo } from 'react';
import type { AppSettings, Card, ReviewLog, Stack } from '../types';
import {
  computeRetentionRate,
  computeStreak,
  countDueCards,
  countDueThisWeek,
  countDueToday,
  countNewCardsStudiedToday,
  countReadyToStudy,
} from '../fsrs/queue';
import './StatsDashboard.css';

interface StatsDashboardProps {
  cards: Card[];
  stacks: Stack[];
  reviewLogs: ReviewLog[];
  settings: AppSettings;
}

export function StatsDashboard({ cards, stacks, reviewLogs, settings }: StatsDashboardProps) {
  const now = Date.now();
  const newToday = useMemo(() => countNewCardsStudiedToday(reviewLogs, now), [reviewLogs, now]);

  const stats = useMemo(
    () => ({
      total: cards.length,
      dueToday: countDueToday(cards, now),
      dueNow: countReadyToStudy(cards, settings, newToday, now),
      dueThisWeek: countDueThisWeek(cards, now),
      retention: computeRetentionRate(reviewLogs, 30, now),
      streak: computeStreak(reviewLogs, now),
    }),
    [cards, reviewLogs, settings, newToday, now],
  );

  const perStack = useMemo(() => {
    return stacks.map((stack) => {
      const stackCards = cards.filter((c) => c.stackId === stack.id);
      return {
        stack,
        total: stackCards.length,
        due: countDueCards(stackCards, now),
        new: stackCards.filter((c) => c.state === 'New').length,
      };
    });
  }, [stacks, cards, now]);

  return (
    <div className="stats">
      <div className="stats__grid">
        <div className="stats__card">
          <span className="stats__value">{stats.total}</span>
          <span className="stats__label">Total cards</span>
        </div>
        <div className="stats__card">
          <span className="stats__value">{stats.dueNow}</span>
          <span className="stats__label">Due now</span>
        </div>
        <div className="stats__card">
          <span className="stats__value">{stats.dueToday}</span>
          <span className="stats__label">Due today</span>
        </div>
        <div className="stats__card">
          <span className="stats__value">{stats.dueThisWeek}</span>
          <span className="stats__label">Due this week</span>
        </div>
        <div className="stats__card">
          <span className="stats__value">{stats.retention != null ? `${stats.retention}%` : '—'}</span>
          <span className="stats__label">Retention (30d)</span>
        </div>
        <div className="stats__card">
          <span className="stats__value">{stats.streak}</span>
          <span className="stats__label">Day streak</span>
        </div>
      </div>

      {perStack.length > 0 && (
        <section className="stats__section">
          <h3 className="stats__heading">By stack</h3>
          <ul className="stats__stack-list">
            {perStack.map(({ stack, total, due, new: newCount }) => (
              <li key={stack.id} className="stats__stack-item">
                <div>
                  <span className="stats__stack-name">{stack.name}</span>
                  <span className="stats__stack-lang">{stack.language}</span>
                </div>
                <span className="stats__stack-counts">
                  {total} total · {due} due · {newCount} new
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
