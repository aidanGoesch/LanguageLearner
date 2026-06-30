import { useEffect, useState } from 'react';
import type { Stack } from '../types';

interface StackFormProps {
  initial?: Stack | null;
  onSubmit: (data: { name: string; language: string }) => void;
  onCancel: () => void;
}

export function StackForm({ initial, onSubmit, onCancel }: StackFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [language, setLanguage] = useState(initial?.language ?? '');

  useEffect(() => {
    setName(initial?.name ?? '');
    setLanguage(initial?.language ?? '');
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !language.trim()) return;
    onSubmit({ name: name.trim(), language: language.trim() });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__label">
        Stack name
        <input
          className="form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="German - Verbs"
          required
        />
      </label>
      <label className="form__label">
        Language
        <input
          className="form__input"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="German"
          required
        />
      </label>
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {initial ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
