import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { StatsDashboard } from '../components/StatsDashboard';
import { getAllCards, getAllReviewLogs, getAllStacks } from '../db';
import type { Card, ReviewLog, Stack } from '../types';

export function Stats() {
  const [cards, setCards] = useState<Card[]>([]);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);

  const load = useCallback(async () => {
    const [c, s, l] = await Promise.all([getAllCards(), getAllStacks(), getAllReviewLogs()]);
    setCards(c);
    setStacks(s);
    setReviewLogs(l);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout title="Stats">
      <StatsDashboard cards={cards} stacks={stacks} reviewLogs={reviewLogs} />
    </Layout>
  );
}
