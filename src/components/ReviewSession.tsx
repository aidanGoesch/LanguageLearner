import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Card, CreatureStage, CreatureStatus, Grade } from '../types';
import { formatDue } from '../utils/cards';
import { GradeButtons } from './GradeButtons';
import { ComboMeter } from './ComboMeter';
import { ParticleBurst } from './ParticleBurst';
import { Creature, type CreatureReaction } from './Creature';
import { prefersReducedMotion, springSoft } from '../ui/motion';
import { sfx } from '../audio/sfx';
import './ReviewSession.css';

const MAX_TIMES_SEEN = 5;
const REQUEUE_OFFSET = 3;

/** Minimum hold after last-card grade before summary (ms). Tuned to creature + particles. */
const LAST_CARD_OUTRO_MS: Record<Grade, number> = {
  easy: 920,
  struggled: 800,
  forgot: 640,
};

const LAST_CARD_OUTRO_REDUCED_MS: Record<Grade, number> = {
  easy: 300,
  struggled: 260,
  forgot: 220,
};

const CARD_ADVANCE_MS: Record<Grade, number> = {
  easy: 420,
  struggled: 420,
  forgot: 280,
};

const GRADE_COPY: Record<Grade, string[]> = {
  easy: ['Nailed it.', 'Effortless recall.', 'That one glows.'],
  struggled: ['Got there.', 'Wobbly, but it stuck.', 'Close — counts.'],
  forgot: ['Back in the queue.', 'No worries — revisit soon.', 'Filed for another look.'],
};

interface ReviewSessionProps {
  cards: Card[];
  combo: number;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
  creatureStage?: CreatureStage;
  creatureStatus?: CreatureStatus;
  creatureSkin?: string;
  creatureAccessories?: string[];
  onGrade: (card: Card, grade: Grade) => Promise<Card>;
  onComplete: () => void;
}

function playGradeFeedback(grade: Grade, soundEnabled: boolean, hapticsEnabled: boolean): void {
  if (soundEnabled) {
    if (grade === 'forgot') sfx.play('forgot');
    else if (grade === 'easy') sfx.play('hitEasy');
    else sfx.play('hitStruggled');
  }
  if (hapticsEnabled) {
    sfx.vibrate(grade === 'easy' ? [8, 40, 8] : grade === 'forgot' ? 12 : 18);
  }
}

export function ReviewSession({
  cards,
  combo,
  soundEnabled = true,
  hapticsEnabled = true,
  creatureStage = 'egg',
  creatureStatus = 'happy',
  creatureSkin,
  creatureAccessories,
  onGrade,
  onComplete,
}: ReviewSessionProps) {
  const [queue, setQueue] = useState(cards);
  const [reviewed, setReviewed] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [holdCard, setHoldCard] = useState<Card | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastGrade, setLastGrade] = useState<Grade | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [termGlow, setTermGlow] = useState<Grade | null>(null);
  const [flashGrade, setFlashGrade] = useState<Grade | null>(null);
  const [reaction, setReaction] = useState<CreatureReaction>('idle');
  const [seenCount, setSeenCount] = useState<Map<string, number>>(() => new Map());
  const sessionRef = useRef<HTMLDivElement>(null);
  const finishingRef = useRef(false);
  const outroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionDoneRef = useRef(false);
  const outroMinMetRef = useRef(false);

  useEffect(() => {
    const root = sessionRef.current;
    if (!root) return;
    const warm = () => sfx.warmup();
    root.addEventListener('pointerdown', warm, { once: true, capture: true });
    return () => root.removeEventListener('pointerdown', warm, { capture: true });
  }, []);

  useEffect(() => {
    setQueue(cards);
    setReviewed(0);
    setSeenCount(new Map());
    setFinishing(false);
    setHoldCard(null);
    finishingRef.current = false;
    setFlipped(false);
    setFeedback(null);
    setLastGrade(null);
    setReaction('idle');
    reactionDoneRef.current = false;
    outroMinMetRef.current = false;
    if (outroTimerRef.current) {
      clearTimeout(outroTimerRef.current);
      outroTimerRef.current = null;
    }
  }, [cards]);

  const current = holdCard ?? queue[0];

  const tryFinishSession = useCallback(() => {
    if (!finishingRef.current || !reactionDoneRef.current || !outroMinMetRef.current) return;
    onComplete();
  }, [onComplete]);

  const startSessionOutro = useCallback(
    (grade: Grade) => {
      reactionDoneRef.current = false;
      outroMinMetRef.current = false;

      const minMs = prefersReducedMotion()
        ? LAST_CARD_OUTRO_REDUCED_MS[grade]
        : LAST_CARD_OUTRO_MS[grade];

      if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
      outroTimerRef.current = setTimeout(() => {
        outroMinMetRef.current = true;
        tryFinishSession();
      }, minMs);
    },
    [tryFinishSession],
  );

  useEffect(() => {
    return () => {
      if (outroTimerRef.current) clearTimeout(outroTimerRef.current);
    };
  }, []);

  const handleReactionEnd = useCallback(() => {
    if (finishingRef.current) {
      reactionDoneRef.current = true;
      tryFinishSession();
      return;
    }
    setReaction('idle');
  }, [tryFinishSession]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 1400);
    return () => clearTimeout(timer);
  }, [feedback]);

  if (!current) {
    return null;
  }

  const total = reviewed + queue.length + (holdCard ? 1 : 0);

  const handleGrade = async (grade: Grade) => {
    if (grading || finishing) return;

    playGradeFeedback(grade, soundEnabled, hapticsEnabled);

    setGrading(true);
    setLastGrade(grade);
    setBurstKey((k) => k + 1);
    setTermGlow(grade);
    if (grade !== 'forgot') setFlashGrade(grade);

    if (grade === 'easy') setReaction('bigCorrect');
    else if (grade === 'struggled') setReaction('correct');
    else setReaction('forgot');

    const copy = GRADE_COPY[grade];
    setFeedback(copy[Math.floor(Math.random() * copy.length)]);

    const gradedCard = current;
    const gradePromise = onGrade(gradedCard, grade);

    const seen = (seenCount.get(gradedCard.id) ?? 0) + 1;
    setSeenCount((prev) => new Map(prev).set(gradedCard.id, seen));

    const [updated] = await Promise.all([
      gradePromise,
      new Promise<void>((resolve) => setTimeout(resolve, CARD_ADVANCE_MS[grade])),
    ]);

    const shouldRequeue =
      (updated.state === 'Learning' || updated.state === 'Relearning') &&
      seen < MAX_TIMES_SEEN &&
      grade !== 'easy';

    const isLastInSession = queue.length === 1 && !shouldRequeue;

    if (isLastInSession) {
      finishingRef.current = true;
      setHoldCard(gradedCard);
      setFinishing(true);
      setQueue([]);
      setReviewed((r) => r + 1);
      setGrading(false);
      startSessionOutro(grade);
      return;
    }

    setQueue((prev) => {
      const next = prev.slice(1);
      if (shouldRequeue) {
        const insertAt = Math.min(REQUEUE_OFFSET, next.length);
        next.splice(insertAt, 0, updated);
      }
      return next;
    });

    setReviewed((r) => r + 1);
    setFlipped(false);
    setTermGlow(null);
    setFlashGrade(null);
    setGrading(false);
  };

  const glowClass = termGlow ? `review-session__card--glow-${termGlow}` : '';
  const termGlowClass = termGlow && termGlow !== 'forgot' ? `review-session__text--glow-${termGlow}` : '';
  const cardPop =
    termGlow === 'easy'
      ? { scale: [1, 1.06, 1.01, 1] }
      : termGlow === 'struggled'
        ? { scale: [1, 1.035, 1] }
        : termGlow === 'forgot'
          ? { scale: [1, 0.99, 1] }
          : { scale: 1 };
  const cardPopDuration = termGlow === 'easy' ? 0.45 : termGlow === 'struggled' ? 0.35 : 0.28;

  return (
    <div className="review-session" ref={sessionRef}>
      {flashGrade && (
        <div
          key={burstKey}
          className={`review-session__flash review-session__flash--${flashGrade}`}
          aria-hidden
        />
      )}
      <ComboMeter combo={combo} />
      <div className="review-session__top">
        <div className="review-session__progress">
          {reviewed} / {total}
        </div>
        <Creature
          stage={creatureStage}
          status={creatureStatus}
          skin={creatureSkin}
          accessories={creatureAccessories}
          reaction={reaction}
          size={72}
          onReactionEnd={handleReactionEnd}
        />
      </div>

      {feedback && (
        <motion.p
          className={`review-session__feedback review-session__feedback--${lastGrade ?? 'struggled'}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
        >
          {feedback}
          {lastGrade && lastGrade !== 'forgot' && (
            <span className="review-session__sched">
              {' '}
              · {formatDue(current.due, current.state)}
            </span>
          )}
        </motion.p>
      )}

      <div className="review-session__card-wrap">
        <ParticleBurst key={burstKey} grade={lastGrade ?? 'struggled'} combo={combo} active={!!lastGrade && burstKey > 0} />
        <motion.button
          type="button"
          className={`review-session__card ${flipped ? 'review-session__card--flipped' : ''} ${glowClass}`}
          onClick={() => !flipped && setFlipped(true)}
          aria-label={flipped ? 'Showing definition' : 'Tap to reveal definition'}
          animate={cardPop}
          transition={{ duration: cardPopDuration, ease: 'easeOut' }}
        >
          <div className="review-session__face review-session__face--front">
            <p className={`review-session__text ${termGlowClass}`}>{current.term}</p>
            {!flipped && <span className="review-session__hint">Tap to reveal</span>}
          </div>
          {flipped && (
            <div className="review-session__face review-session__face--back">
              <p className="review-session__text review-session__text--definition">{current.definition}</p>
            </div>
          )}
        </motion.button>
      </div>
      {flipped && !finishing && <GradeButtons onGrade={handleGrade} disabled={grading} />}
    </div>
  );
}
