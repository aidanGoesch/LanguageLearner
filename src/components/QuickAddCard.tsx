import { useEffect, useMemo, useState } from 'react';
import { useAutoTranslateDefinition } from '../hooks/useAutoTranslateDefinition';
import type { Stack } from '../types';
import './CardBubble.css';

interface QuickAddCardProps {
  stacks: Stack[];
  onSubmit: (data: { term: string; definition: string; stackId: string }) => Promise<void>;
}

export function QuickAddCard({ stacks, onSubmit }: QuickAddCardProps) {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [stackId, setStackId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stacks.length === 0) {
      setStackId('');
      return;
    }
    setStackId((current) =>
      current && stacks.some((s) => s.id === current) ? current : stacks[0].id,
    );
  }, [stacks]);

  const sourceLanguage = useMemo(
    () => stacks.find((s) => s.id === stackId)?.language,
    [stacks, stackId],
  );

  const { translating } = useAutoTranslateDefinition({
    term,
    sourceLanguage,
    setDefinition,
  });

  if (stacks.length === 0) {
    return (
      <p className="empty-state empty-state--inline">
        Create a stack first, then add cards here.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim() || !stackId || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ term: term.trim(), definition: definition.trim(), stackId });
      setTerm('');
      setDefinition('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card-bubble card-bubble--new" onSubmit={handleSubmit}>
      <div className="card-bubble__field">
        <span className="card-bubble__label">Deck</span>
        <select
          className="card-bubble__select"
          value={stackId}
          onChange={(e) => setStackId(e.target.value)}
          required
        >
          {stacks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.language})
            </option>
          ))}
        </select>
      </div>
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
          placeholder={translating ? 'Translating…' : 'Translation or meaning'}
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
