import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { StatsDashboard } from '../components/StatsDashboard';
import { getAllCards, getAllReviewLogs, getAllStacks, getSettings } from '../db';
import type { AppSettings, Card, ReviewLog, Stack } from '../types';

export function Stats() {
  const [cards, setCards] = useState<Card[]>([]);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const load = useCallback(async () => {
    const [c, s, l, cfg] = await Promise.all([
      getAllCards(),
      getAllStacks(),
      getAllReviewLogs(),
      getSettings(),
    ]);
    setCards(c);
    setStacks(s);
    setReviewLogs(l);
    setSettings(cfg);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!settings) {
    return (
      <Layout title="Stats">
        <p>Loading stats…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Stats">
      <StatsDashboard cards={cards} stacks={stacks} reviewLogs={reviewLogs} settings={settings} />
    </Layout>
  );
}
