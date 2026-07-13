import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import type { Grade } from '../types';
import './ParticleBurst.css';

interface ParticleBurstProps {
  grade: Grade;
  combo: number;
  active: boolean;
}

const GRADE_COLORS: Record<Grade, string[]> = {
  easy: ['#ffd866', '#ff9f68', '#ffb347', '#fff0c2', '#ffe08a'],
  struggled: ['#88c9a1', '#a8ddb5', '#c8efd8', '#6aab82', '#b5e6c8'],
  forgot: ['#9aa8b8', '#b8c4d0', '#d0d8e0'],
};

export function ParticleBurst({ grade, combo, active }: ParticleBurstProps) {
  const particles = useMemo(() => {
    const count =
      grade === 'easy'
        ? 18 + Math.min(combo, 10)
        : grade === 'struggled'
          ? 12 + Math.min(combo, 4)
          : 4;
    const colors = GRADE_COLORS[grade];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * (grade === 'easy' ? 220 : grade === 'struggled' ? 150 : 120),
      y: -(40 + Math.random() * (grade === 'easy' ? 120 : grade === 'struggled' ? 80 : 60)),
      rotate: Math.random() * 360,
      color: colors[i % colors.length],
      size: grade === 'easy' ? 7 + Math.random() * 7 : grade === 'struggled' ? 5 + Math.random() * 5 : 4 + Math.random() * 4,
      delay: Math.random() * 0.08,
    }));
  }, [grade, combo, active]);

  return (
    <AnimatePresence>
      {active && (
        <div className="particle-burst" aria-hidden>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="particle-burst__dot"
              style={{ background: p.color, width: p.size, height: p.size }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: 0.2, rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: grade === 'forgot' ? 0.55 : 0.75, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
