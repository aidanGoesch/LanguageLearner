import { useEffect, useState } from 'react';
import type { Card, Grade } from '../types';
import { GradeButtons } from './GradeButtons';
import './ReviewSession.css';

interface ReviewSessionProps {
  cards: Card[];
  onGrade: (card: Card, grade: Grade) => Promise<void>;
  onComplete: () => void;
}

export function ReviewSession({ cards, onGrade, onComplete }: ReviewSessionProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [done, setDone] = useState(false);

  const current = cards[index];

  useEffect(() => {
    if (done) onComplete();
  }, [done, onComplete]);

  if (!current || done) {
    return null;
  }

  const handleGrade = async (grade: Grade) => {
    if (grading) return;
    setGrading(true);
    await onGrade(current, grade);
    setFlipped(false);
    setGrading(false);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="review-session">
      <div className="review-session__progress">
        {index + 1} / {cards.length}
      </div>
      <button
        type="button"
        className={`review-session__card ${flipped ? 'review-session__card--flipped' : ''}`}
        onClick={() => !flipped && setFlipped(true)}
        aria-label={flipped ? 'Showing definition' : 'Tap to reveal definition'}
      >
        <div className="review-session__face review-session__face--front">
          <p className="review-session__text">{current.term}</p>
          {!flipped && <span className="review-session__hint">Tap to reveal</span>}
        </div>
        {flipped && (
          <div className="review-session__face review-session__face--back">
            <p className="review-session__text review-session__text--definition">{current.definition}</p>
          </div>
        )}
      </button>
      {flipped && <GradeButtons onGrade={handleGrade} disabled={grading} />}
    </div>
  );
}
