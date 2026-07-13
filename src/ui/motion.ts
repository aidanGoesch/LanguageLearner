/**
 * Shared motion language for the whole app.
 *
 * Everything springs — nothing linear. These presets keep the "alive" feel
 * consistent across the creature, buttons, cards, and reward beats. Import a
 * preset instead of hand-tuning stiffness/damping per component so the world
 * moves with one coherent physicality.
 */

import type { Transition, Variants } from 'framer-motion';

/** Returns true if the user has asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Snappy, lively spring — buttons, taps, quick reactions. */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 24,
  mass: 0.8,
};

/** Soft, cozy spring — page/element entrances, gentle settling. */
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 210,
  damping: 26,
  mass: 1,
};

/** Bouncy, celebratory spring — level-ups, big wins, rewards. */
export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 12,
  mass: 0.9,
};

/** Slow, breathing spring — idle loops, ambient drift. */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 90,
  damping: 18,
  mass: 1.2,
};

/**
 * Squash-and-stretch keyframe transforms for a lively "pop" (e.g. a correct
 * answer). Feed these arrays to framer-motion's `animate` on scaleX/scaleY.
 */
export const squashStretch = {
  scaleX: [1, 1.16, 0.9, 1.04, 1],
  scaleY: [1, 0.86, 1.12, 0.98, 1],
  transition: {
    duration: 0.5,
    ease: [0.34, 1.56, 0.64, 1] as const,
    times: [0, 0.25, 0.5, 0.75, 1],
  },
} satisfies { scaleX: number[]; scaleY: number[]; transition: Transition };

/** A bigger, celebratory squash-and-stretch for standout moments. */
export const bigSquashStretch = {
  scaleX: [1, 1.28, 0.82, 1.1, 0.97, 1],
  scaleY: [1, 0.78, 1.24, 0.92, 1.03, 1],
  transition: {
    duration: 0.72,
    ease: [0.34, 1.56, 0.64, 1] as const,
    times: [0, 0.18, 0.4, 0.62, 0.82, 1],
  },
} satisfies { scaleX: number[]; scaleY: number[]; transition: Transition };

/** Standard interactive scale for tappable things (use with whileTap). */
export const tapScale = { scale: 0.94 } as const;

/** Standard hover lift for tappable things (use with whileHover). */
export const hoverLift = { scale: 1.04, y: -2 } as const;

/** Fade-and-rise entrance variant set for lists/panels. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

/** Pop-in entrance variant set (scales up with overshoot). */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
};

/** Stagger container for revealing children one-by-one. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/**
 * Picks a transition honoring reduced-motion. When reduced motion is on we
 * fall back to a near-instant tween so state still updates without bouncing.
 */
export function motionSafe(transition: Transition): Transition {
  return prefersReducedMotion() ? { duration: 0.001 } : transition;
}
