import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StackForm } from '../components/StackForm';
import { StackList } from '../components/StackList';
import {
  createStack,
  deleteStack,
  getAllCards,
  getAllStacks,
  updateStack,
} from '../db';
import { deleteCardsByStack } from '../db/cards';
import { deleteReviewLogsByCardIds } from '../db/reviewLogs';
import { useConfirm } from '../context/ConfirmContext';
import type { Stack } from '../types';

export function ManageStacks() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [editing, setEditing] = useState<Stack | null>(null);
  const [creating, setCreating] = useState(false);
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const confirm = useConfirm();

  const load = useCallback(async () => {
    const [allStacks, allCards] = await Promise.all([getAllStacks(), getAllCards()]);
    setStacks(allStacks);
    const counts: Record<string, number> = {};
    for (const card of allCards) {
      counts[card.stackId] = (counts[card.stackId] ?? 0) + 1;
    }
    setCardCounts(counts);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedStacks = useMemo(
    () => [...stacks].sort((a, b) => a.name.localeCompare(b.name)),
    [stacks],
  );

  const handleCreate = async (data: { name: string; language: string }) => {
    await createStack(data);
    setCreating(false);
    await load();
  };

  const handleUpdate = async (data: { name: string; language: string }) => {
    if (!editing) return;
    await updateStack({ ...editing, ...data });
    setEditing(null);
    await load();
  };

  const handleDelete = async (stack: Stack) => {
    const cards = await getAllCards();
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
        </div>
      )}

      <StackList
        stacks={sortedStacks}
        cardCounts={cardCounts}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

      {sortedStacks.length > 0 && (
        <div className="page-links">
          {sortedStacks.map((s) => (
            <Link key={s.id} to={`/cards?stack=${s.id}`} className="btn btn--ghost btn--block">
              Manage cards in {s.name}
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
