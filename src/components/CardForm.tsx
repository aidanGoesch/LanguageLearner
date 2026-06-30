import { useEffect, useState } from 'react';
import type { Card, Stack } from '../types';

interface CardFormProps {
  stacks: Stack[];
  initial?: Card | null;
  defaultStackId?: string;
  onSubmit: (data: { term: string; definition: string; stackId: string }) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function CardForm({
  stacks,
  initial,
  defaultStackId,
  onSubmit,
  onCancel,
  compact,
}: CardFormProps) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [stackId, setStackId] = useState(initial?.stackId ?? defaultStackId ?? stacks[0]?.id ?? '');

  useEffect(() => {
    setTerm(initial?.term ?? '');
    setDefinition(initial?.definition ?? '');
    setStackId(initial?.stackId ?? defaultStackId ?? stacks[0]?.id ?? '');
  }, [initial, defaultStackId, stacks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim() || !stackId) return;
    onSubmit({ term: term.trim(), definition: definition.trim(), stackId });
    if (!initial) {
      setTerm('');
      setDefinition('');
    }
  };

  if (stacks.length === 0) {
    return <p className="empty-state">Create a stack before adding cards.</p>;
  }

  return (
    <form className={`form ${compact ? 'form--compact' : ''}`} onSubmit={handleSubmit}>
      {!compact && (
        <label className="form__label">
          Stack
          <select className="form__input" value={stackId} onChange={(e) => setStackId(e.target.value)} required>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.language})
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="form__label">
        Term
        <input
          className="form__input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Word or phrase"
          required
          autoFocus={compact}
        />
      </label>
      <label className="form__label">
        Definition
        <input
          className="form__input"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Translation or meaning"
          required
        />
      </label>
      {compact && (
        <label className="form__label">
          Stack
          <select className="form__input" value={stackId} onChange={(e) => setStackId(e.target.value)} required>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn--primary">
          {initial ? 'Save' : 'Add card'}
        </button>
      </div>
    </form>
  );
}
