import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ReviewSession } from '../components/ReviewSession';
import { SessionSummary } from '../components/SessionSummary';
import { StudyScopePicker } from '../components/StudyScopePicker';
import {
  addReviewLog,
  getAllCards,
  getAllReviewLogs,
  getAllStacks,
  getSettings,
  updateCard,
} from '../db';
import {
  buildQueue,
  countNewCardsStudiedToday,
  filterCardsByScope,
  forecastDue,
} from '../fsrs/queue';
import { gradeCard } from '../fsrs/grade';
import type { Card, Grade, SessionStats, StudyScope } from '../types';

export function Study() {
  const [phase, setPhase] = useState<'pick' | 'review' | 'done'>('pick');
  const [queue, setQueue] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [stacks, setStacks] = useState<Awaited<ReturnType<typeof getAllStacks>>>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    forgot: 0,
    struggled: 0,
    easy: 0,
  });

  const loadData = useCallback(async () => {
    const [cards, stackList, logs, settings] = await Promise.all([
      getAllCards(),
      getAllStacks(),
      getAllReviewLogs(),
      getSettings(),
    ]);
    setAllCards(cards);
    setStacks(stackList);
    return { cards, stackList, logs, settings };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStart = async (scope: StudyScope) => {
    const { cards, stackList, logs, settings } = await loadData();
    const scoped = filterCardsByScope(cards, stackList, scope);
    const newToday = countNewCardsStudiedToday(logs);
    const built = buildQueue(scoped, settings, newToday);
    if (built.length === 0) {
      alert('No cards due for this selection. Check back later!');
      return;
    }
    setQueue(built);
    setSessionStats({ total: 0, forgot: 0, struggled: 0, easy: 0 });
    setPhase('review');
  };

  const handleGrade = async (card: Card, grade: Grade) => {
    const settings = await getSettings();
    const { card: updated, log } = gradeCard(card, grade, settings);
    await updateCard(updated);
    await addReviewLog(log);
    setSessionStats((s) => ({
      total: s.total + 1,
      forgot: s.forgot + (grade === 'forgot' ? 1 : 0),
      struggled: s.struggled + (grade === 'struggled' ? 1 : 0),
      easy: s.easy + (grade === 'easy' ? 1 : 0),
    }));
    setAllCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleComplete = useCallback(async () => {
    const cards = await getAllCards();
    setAllCards(cards);
    setPhase('done');
  }, []);

  if (phase === 'review' && queue.length > 0) {
    return (
      <Layout hideNav>
        <ReviewSession cards={queue} onGrade={handleGrade} onComplete={handleComplete} />
      </Layout>
    );
  }

  if (phase === 'done') {
    return (
      <Layout title="Session">
        <SessionSummary stats={sessionStats} forecast={forecastDue(allCards)} />
      </Layout>
    );
  }

  return (
    <Layout title="Study">
      <StudyScopePicker stacks={stacks} onStart={handleStart} />
    </Layout>
  );
}
