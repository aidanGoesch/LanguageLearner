import { useEffect, useMemo, useState } from 'react';
import type { Card, Stack } from '../types';
import './CardBubble.css';
import './CardList.css';

interface CardListProps {
  cards: Card[];
  stacks?: Stack[];
  selectedStackId?: string;
  onUpdate: (card: Card, data: { term: string; definition: string }) => Promise<void>;
  onDelete: (card: Card) => void;
  onAdd?: (data: { term: string; definition: string; stackId: string }) => Promise<void>;
  showNewCard?: boolean;
}

function NewCardBubble({
  stackId,
  stackName,
  onAdd,
}: {
  stackId: string;
  stackName?: string;
  onAdd: (data: { term: string; definition: string; stackId: string }) => Promise<void>;
}) {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim() || !stackId || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({ term: term.trim(), definition: definition.trim(), stackId });
      setTerm('');
      setDefinition('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card-bubble card-bubble--new" onSubmit={handleSubmit}>
      {stackName && (
        <p className="card-bubble__deck-hint">Adding to {stackName}</p>
      )}
      <div className="card-bubble__field">
        <span className="card-bubble__label">Term</span>
        <input
          className="card-bubble__input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Word or phrase"
          required
        />
      </div>
      <div className="card-bubble__field">
        <span className="card-bubble__label">Definition</span>
        <input
          className="card-bubble__input"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Translation or meaning"
          required
        />
      </div>
      <div className="card-bubble__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting || !stackId}>
          {submitting ? 'Adding…' : 'Add card'}
        </button>
      </div>
    </form>
  );
}

function CardBubbleItem({
  card,
  onUpdate,
  onDelete,
}: {
  card: Card;
  onUpdate: (card: Card, data: { term: string; definition: string }) => Promise<void>;
  onDelete: (card: Card) => void;
}) {
  const [term, setTerm] = useState(card.term);
  const [definition, setDefinition] = useState(card.definition);
  const [focusedField, setFocusedField] = useState<'term' | 'definition' | null>(null);

  useEffect(() => {
    setTerm(card.term);
    setDefinition(card.definition);
  }, [card.id, card.term, card.definition]);

  const saveIfChanged = async () => {
    const trimmedTerm = term.trim();
    const trimmedDefinition = definition.trim();

    if (trimmedTerm === card.term && trimmedDefinition === card.definition) return;

    if (!trimmedTerm || !trimmedDefinition) {
      setTerm(card.term);
      setDefinition(card.definition);
      return;
    }

    await onUpdate(card, { term: trimmedTerm, definition: trimmedDefinition });
  };

  const handleBlur = () => {
    setFocusedField(null);
    void saveIfChanged();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <li>
      <article className="card-bubble">
        <div className="card-bubble__header">
          <span className="card-bubble__state">{card.state}</span>
          <button
            type="button"
            className="card-bubble__delete"
            onClick={() => onDelete(card)}
            aria-label={`Delete ${card.term}`}
          >
            Delete
          </button>
        </div>
        <div className="card-bubble__field">
          <span className="card-bubble__label">Term</span>
          <input
            className={`card-bubble__input card-bubble__input--inline ${focusedField === 'term' ? 'card-bubble__input--focused' : ''}`}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => setFocusedField('term')}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-label="Term"
          />
        </div>
        <div className="card-bubble__field">
          <span className="card-bubble__label">Definition</span>
          <input
            className={`card-bubble__input card-bubble__input--inline ${focusedField === 'definition' ? 'card-bubble__input--focused' : ''}`}
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            onFocus={() => setFocusedField('definition')}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-label="Definition"
          />
        </div>
      </article>
    </li>
  );
}

export function CardList({
  cards,
  stacks,
  selectedStackId,
  onUpdate,
  onDelete,
  onAdd,
  showNewCard,
}: CardListProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return cards;
    return cards.filter(
      (c) => c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q),
    );
  }, [cards, query]);

  const selectedStack = stacks?.find((s) => s.id === selectedStackId);
  const showAddBubble = showNewCard && onAdd && selectedStackId;

  return (
    <div className="card-list">
      {showAddBubble && (
        <NewCardBubble
          stackId={selectedStackId}
          stackName={selectedStack?.name}
          onAdd={onAdd}
        />
      )}

      {(cards.length > 0 || showAddBubble) && (
        <input
          className="form__input card-list__search"
          type="search"
          placeholder="Search cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {cards.length === 0 && !showAddBubble && (
        <p className="empty-state">No cards in this stack yet.</p>
      )}

      <ul className="card-list__items">
        {filtered.map((card) => (
          <CardBubbleItem
            key={card.id}
            card={card}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>

      {cards.length > 0 && filtered.length === 0 && (
        <p className="empty-state">No cards match your search.</p>
      )}
    </div>
  );
}
