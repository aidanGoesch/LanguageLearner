import { useEffect, useState } from 'react';
import type { Card, Grade } from '../types';
import { formatDue } from '../utils/cards';
import { GradeButtons } from './GradeButtons';
import './ReviewSession.css';

const MAX_TIMES_SEEN = 5;
const REQUEUE_OFFSET = 3;

interface ReviewSessionProps {
  cards: Card[];
  onGrade: (card: Card, grade: Grade) => Promise<Card>;
  onComplete: () => void;
}

export function ReviewSession({ cards, onGrade, onComplete }: ReviewSessionProps) {
  const [queue, setQueue] = useState(cards);
  const [reviewed, setReviewed] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [seenCount, setSeenCount] = useState<Map<string, number>>(() => new Map());

  useEffect(() => {
    setQueue(cards);
    setReviewed(0);
    setSeenCount(new Map());
    setDone(false);
    setFlipped(false);
    setFeedback(null);
  }, [cards]);

  const current = queue[0];

  useEffect(() => {
    if (done) onComplete();
  }, [done, onComplete]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  if (!current || done) {
    return null;
  }

  const total = reviewed + queue.length;

  const handleGrade = async (grade: Grade) => {
    if (grading) return;
    setGrading(true);
    const updated = await onGrade(current, grade);

    const seen = (seenCount.get(current.id) ?? 0) + 1;
    setSeenCount((prev) => new Map(prev).set(current.id, seen));

    const shouldRequeue =
      (updated.state === 'Learning' || updated.state === 'Relearning') &&
      seen < MAX_TIMES_SEEN &&
      grade !== 'easy';

    setQueue((prev) => {
      const next = prev.slice(1);
      if (shouldRequeue) {
        const insertAt = Math.min(REQUEUE_OFFSET, next.length);
        next.splice(insertAt, 0, updated);
      }
      if (next.length === 0) {
        setDone(true);
      }
      return next;
    });

    setReviewed((r) => r + 1);
    setFeedback(`${updated.state} · ${formatDue(updated.due, updated.state)}`);
    setFlipped(false);
    setGrading(false);
  };

  return (
    <div className="review-session">
      <div className="review-session__progress">
        {reviewed} / {total}
      </div>
      {feedback && <p className="review-session__feedback">{feedback}</p>}
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
