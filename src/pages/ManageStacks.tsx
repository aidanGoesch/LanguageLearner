import { useCallback, useEffect, useMemo, useState } from 'react';
import { BulkAddForm } from '../components/BulkAddForm';
import { CardList } from '../components/CardList';
import { Layout } from '../components/Layout';
import { StackForm } from '../components/StackForm';
import { StackList } from '../components/StackList';
import {
  createCard,
  createStack,
  deleteCard,
  deleteStack,
  getAllCards,
  getAllStacks,
  updateCard,
  updateStack,
} from '../db';
import { deleteCardsByStack } from '../db/cards';
import { deleteReviewLogsByCardIds } from '../db/reviewLogs';
import { createNewCardFields } from '../utils/cards';
import { useConfirm } from '../context/ConfirmContext';
import type { Card, Stack } from '../types';

export function ManageStacks() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [editing, setEditing] = useState<Stack | null>(null);
  const [creating, setCreating] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const [allStacks, allCards] = await Promise.all([getAllStacks(), getAllCards()]);
    setStacks(allStacks);
    setCards(allCards);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedStacks = useMemo(
    () => [...stacks].sort((a, b) => a.name.localeCompare(b.name)),
    [stacks],
  );

  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.stackId] = (counts[card.stackId] ?? 0) + 1;
    }
    return counts;
  }, [cards]);

  const editingCards = useMemo(
    () => (editing ? cards.filter((c) => c.stackId === editing.id) : []),
    [cards, editing],
  );

  const startEditing = (stack: Stack) => {
    setCreating(false);
    setShowBulk(false);
    setEditing(stack);
  };

  const handleCreate = async (data: { name: string; language: string }) => {
    await createStack(data);
    setCreating(false);
    await load();
  };

  const handleUpdate = async (data: { name: string; language: string }) => {
    if (!editing) return;
    await updateStack({ ...editing, ...data });
    setEditing(null);
    setShowBulk(false);
    await load();
  };

  const handleDelete = async (stack: Stack) => {
    const cardIds = cards.filter((c) => c.stackId === stack.id).map((c) => c.id);
    const ok = await confirm({
      title: 'Delete stack?',
      message: `Delete "${stack.name}" and all ${cardIds.length} card${cardIds.length !== 1 ? 's' : ''} in it? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteReviewLogsByCardIds(cardIds);
    await deleteCardsByStack(stack.id);
    await deleteStack(stack.id);
    if (editing?.id === stack.id) setEditing(null);
    await load();
  };

  const handleAddCard = async (data: { term: string; definition: string; stackId: string }) => {
    await createCard(createNewCardFields(data.stackId, data.term, data.definition));
    await load();
  };

  const handleUpdateCard = async (card: Card, data: { term: string; definition: string }) => {
    await updateCard({ ...card, ...data });
    await load();
  };

  const handleDeleteCard = async (card: Card) => {
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
    setShowBulk(false);
    await load();
  };

  return (
    <Layout title="Stacks">
      <div className="page-actions">
        {!creating && !editing && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => setCreating(true)}>
            New stack
          </button>
        )}
      </div>

      {creating && (
        <div className="panel">
          <h2 className="panel__title">New stack</h2>
          <StackForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {editing && (
        <div className="panel">
          <h2 className="panel__title">Edit stack</h2>
          <StackForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />

          <div className="panel__section">
            <div className="panel__section-head">
              <h3 className="panel__subtitle">
                Cards <span className="panel__count">({editingCards.length})</span>
              </h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowBulk((v) => !v)}>
                {showBulk ? 'Single add' : 'Bulk add'}
              </button>
            </div>

            {showBulk ? (
              <BulkAddForm
                stacks={[editing]}
                defaultStackId={editing.id}
                onSubmit={handleBulkAdd}
              />
            ) : (
              <CardList
                cards={editingCards}
                stacks={[editing]}
                selectedStackId={editing.id}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
                onAdd={handleAddCard}
                showNewCard
              />
            )}
          </div>
        </div>
      )}

      {!editing && (
        <StackList
          stacks={sortedStacks}
          cardCounts={cardCounts}
          onEdit={startEditing}
          onDelete={handleDelete}
        />
      )}
    </Layout>
  );
}
