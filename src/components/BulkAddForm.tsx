import { useState } from 'react';
import type { Stack } from '../types';

interface BulkAddFormProps {
  stacks: Stack[];
  defaultStackId?: string;
  onSubmit: (pairs: { term: string; definition: string }[], stackId: string) => void;
}

function parseBulkText(text: string): { term: string; definition: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const commaIdx = line.indexOf(',');
      if (commaIdx === -1) return null;
      const term = line.slice(0, commaIdx).trim();
      const definition = line.slice(commaIdx + 1).trim();
      if (!term || !definition) return null;
      return { term, definition };
    })
    .filter((p): p is { term: string; definition: string } => p !== null);
}

export function BulkAddForm({ stacks, defaultStackId, onSubmit }: BulkAddFormProps) {
  const [text, setText] = useState('');
  const [stackId, setStackId] = useState(defaultStackId ?? stacks[0]?.id ?? '');

  const pairs = parseBulkText(text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pairs.length === 0 || !stackId) return;
    onSubmit(pairs, stackId);
    setText('');
  };

  if (stacks.length === 0) {
    return <p className="empty-state">Create a stack before bulk adding cards.</p>;
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
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
      <label className="form__label">
        Paste cards (one per line: term, definition)
        <textarea
          className="form__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Hallo, Hello\nDanke, Thank you\nBitte, Please'}
          rows={8}
        />
      </label>
      <p className="form__hint">{pairs.length} card{pairs.length !== 1 ? 's' : ''} ready to import</p>
      <button type="submit" className="btn btn--primary btn--block" disabled={pairs.length === 0}>
        Import {pairs.length} card{pairs.length !== 1 ? 's' : ''}
      </button>
    </form>
  );
}
