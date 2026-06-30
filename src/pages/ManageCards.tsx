import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BulkAddForm } from '../components/BulkAddForm';
import { CardList } from '../components/CardList';
import { Layout } from '../components/Layout';
import {
  createCard,
  deleteCard,
  getAllCards,
  getAllStacks,
  updateCard,
} from '../db';
import { createNewCardFields } from '../utils/cards';
import { useConfirm } from '../context/ConfirmContext';
import type { Card, Stack } from '../types';

export function ManageCards() {
  const [searchParams] = useSearchParams();
  const initialStackId = searchParams.get('stack') ?? '';

  const [stacks, setStacks] = useState<Stack[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedStackId, setSelectedStackId] = useState(initialStackId);
  const [showBulk, setShowBulk] = useState(false);
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const [allStacks, allCards] = await Promise.all([getAllStacks(), getAllCards()]);
    setStacks(allStacks);
    setCards(allCards);
    setSelectedStackId((current) => {
      if (current && allStacks.some((s) => s.id === current)) return current;
      return allStacks[0]?.id ?? '';
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialStackId) setSelectedStackId(initialStackId);
  }, [initialStackId]);

  const stackCards = useMemo(
    () =>
      selectedStackId
        ? cards.filter((c) => c.stackId === selectedStackId)
        : cards,
    [cards, selectedStackId],
  );

  const handleAdd = async (data: { term: string; definition: string; stackId: string }) => {
    const targetStackId = selectedStackId || data.stackId;
    await createCard(createNewCardFields(targetStackId, data.term, data.definition));
    await load();
  };

  const handleUpdate = async (card: Card, data: { term: string; definition: string }) => {
    await updateCard({ ...card, ...data });
    await load();
  };

  const handleDelete = async (card: Card) => {
    const ok = await confirm({
      title: 'Delete card?',
      message: `Delete "${card.term}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteCard(card.id);
    await load();
  };

  const handleBulkAdd = async (pairs: { term: string; definition: string }[], stackId: string) => {
    for (const pair of pairs) {
      await createCard(createNewCardFields(stackId, pair.term, pair.definition));
    }
    await load();
  };

  return (
    <Layout title="Cards">
      {stacks.length > 0 && (
        <label className="form__label deck-picker">
          Stack
          <select
            className="form__input"
            value={selectedStackId}
            onChange={(e) => setSelectedStackId(e.target.value)}
          >
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.language})
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="page-actions">
        <button type="button" className="btn btn--ghost" onClick={() => setShowBulk((v) => !v)}>
          {showBulk ? 'Single add' : 'Bulk add'}
        </button>
      </div>

      {showBulk ? (
        <BulkAddForm stacks={stacks} defaultStackId={selectedStackId} onSubmit={handleBulkAdd} />
      ) : (
        <CardList
          cards={stackCards}
          stacks={stacks}
          selectedStackId={selectedStackId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAdd={handleAdd}
          showNewCard
        />
      )}
    </Layout>
  );
}
