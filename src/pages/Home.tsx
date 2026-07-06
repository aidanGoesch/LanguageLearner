import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { QuickAddCard } from '../components/QuickAddCard';
import { getAllCards, getAllReviewLogs, getAllStacks, getSettings } from '../db';
import { countNewCardsStudiedToday, countReadyToStudy } from '../fsrs/queue';
import { createCard } from '../db/cards';
import { createNewCardFields } from '../utils/cards';
import type { Stack } from '../types';

export function Home() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    const [allStacks, allCards, logs, settings] = await Promise.all([
      getAllStacks(),
      getAllCards(),
      getAllReviewLogs(),
      getSettings(),
    ]);
    setStacks(allStacks);
    const newToday = countNewCardsStudiedToday(logs);
    setDueCount(countReadyToStudy(allCards, settings, newToday));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuickAdd = async (data: { term: string; definition: string; stackId: string }) => {
    await createCard(createNewCardFields(data.stackId, data.term, data.definition));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    await load();
  };

  return (
    <Layout>
      <div className="home">
        <section className="home__hero">
          <p className="home__due">{dueCount} card{dueCount !== 1 ? 's' : ''} ready to study</p>
          <Link to="/study" className="btn btn--primary btn--block btn--lg">
            Study now
          </Link>
        </section>

        <section className="home__section">
          <h2 className="home__section-title">Quick add</h2>
          {added && <p className="home__success">Card added!</p>}
          <QuickAddCard stacks={stacks} onSubmit={handleQuickAdd} />
        </section>

        <section className="home__links">
          <Link to="/stacks" className="home__link-card">
            <span className="home__link-title">Manage stacks</span>
            <span className="home__link-desc">{stacks.length} stack{stacks.length !== 1 ? 's' : ''}</span>
          </Link>
          <Link to="/cards" className="home__link-card">
            <span className="home__link-title">Manage cards</span>
            <span className="home__link-desc">Browse and edit all cards</span>
          </Link>
        </section>
      </div>
    </Layout>
  );
}
