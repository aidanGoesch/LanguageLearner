import { useMemo, useState } from 'react';
import type { Stack, StudyScope } from '../types';
import './StudyScopePicker.css';

interface StudyScopePickerProps {
  stacks: Stack[];
  onStart: (scope: StudyScope) => void;
}

type ScopeMode = 'all' | 'language' | 'stack' | 'custom';

export function StudyScopePicker({ stacks, onStart }: StudyScopePickerProps) {
  const [mode, setMode] = useState<ScopeMode>('all');
  const [language, setLanguage] = useState('');
  const [stackId, setStackId] = useState(stacks[0]?.id ?? '');
  const [selectedStackIds, setSelectedStackIds] = useState<Set<string>>(new Set());

  const languages = useMemo(
    () => [...new Set(stacks.map((s) => s.language))].sort(),
    [stacks],
  );

  const toggleStack = (id: string) => {
    setSelectedStackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    switch (mode) {
      case 'all':
        onStart({ type: 'all' });
        break;
      case 'language':
        if (language) onStart({ type: 'language', language });
        break;
      case 'stack':
        if (stackId) onStart({ type: 'stack', stackId });
        break;
      case 'custom':
        if (selectedStackIds.size > 0) {
          onStart({ type: 'custom', stackIds: [...selectedStackIds] });
        }
        break;
    }
  };

  const canStart =
    mode === 'all' ||
    (mode === 'language' && language) ||
    (mode === 'stack' && stackId) ||
    (mode === 'custom' && selectedStackIds.size > 0);

  if (stacks.length === 0) {
    return <p className="empty-state">Create a stack and add cards before studying.</p>;
  }

  return (
    <div className="scope-picker">
      <div className="scope-picker__modes">
        {(['all', 'language', 'stack', 'custom'] as ScopeMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`scope-picker__mode ${mode === m ? 'active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'all' && 'All languages'}
            {m === 'language' && 'One language'}
            {m === 'stack' && 'One stack'}
            {m === 'custom' && 'Custom'}
          </button>
        ))}
      </div>

      {mode === 'language' && (
        <select
          className="form__input"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">Select language</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      )}

      {mode === 'stack' && (
        <select className="form__input" value={stackId} onChange={(e) => setStackId(e.target.value)}>
          {stacks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.language})
            </option>
          ))}
        </select>
      )}

      {mode === 'custom' && (
        <ul className="scope-picker__stacks">
          {stacks.map((s) => (
            <li key={s.id}>
              <label className="scope-picker__check">
                <input
                  type="checkbox"
                  checked={selectedStackIds.has(s.id)}
                  onChange={() => toggleStack(s.id)}
                />
                <span>
                  {s.name} <span className="scope-picker__lang">({s.language})</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn btn--primary btn--block btn--lg"
        disabled={!canStart}
        onClick={handleStart}
      >
        Start session
      </button>
    </div>
  );
}
