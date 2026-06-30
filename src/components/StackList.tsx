import type { Stack } from '../types';
import './StackList.css';

interface StackListProps {
  stacks: Stack[];
  onEdit: (stack: Stack) => void;
  onDelete: (stack: Stack) => void;
  cardCounts?: Record<string, number>;
}

export function StackList({ stacks, onEdit, onDelete, cardCounts }: StackListProps) {
  if (stacks.length === 0) {
    return <p className="empty-state">No stacks yet. Create one to get started.</p>;
  }

  return (
    <ul className="stack-list">
      {stacks.map((stack) => (
        <li key={stack.id} className="stack-list__item">
          <div className="stack-list__info">
            <span className="stack-list__name">{stack.name}</span>
            <span className="stack-list__meta">
              {stack.language}
              {cardCounts && ` · ${cardCounts[stack.id] ?? 0} cards`}
            </span>
          </div>
          <div className="stack-list__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(stack)}>
              Edit
            </button>
            <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => onDelete(stack)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
