/**
 * Creature — the app's emotional centerpiece.
 *
 * A hand-built, animated SVG "den sprite": a round, glowing, big-eyed creature
 * that lives in a woven nest. It is deliberately PRESENTATIONAL — it takes only
 * explicit props and imports no DB/game types, so it stays decoupled from the
 * persistence layer other agents own. The parent maps its stored creature state
 * onto these props.
 *
 * It is never static: a continuous idle loop (breathing + occasional blink)
 * keeps it alive, and short squash-and-stretch reactions punctuate study moments.
 * Reduced-motion users get a calm, still creature instead.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { prefersReducedMotion } from '../../ui/motion';
import './Creature.css';

export type CreatureStage = 'egg' | 'baby' | 'juvenile' | 'adult' | 'elder';
export type CreatureStatus = 'happy' | 'hungry' | 'sick' | 'critical' | 'gone';
export type CreatureReaction =
  | 'idle'
  | 'correct'
  | 'bigCorrect'
  | 'forgot'
  | 'eat'
  | 'levelUp';

export interface CreatureProps {
  stage: CreatureStage;
  species?: string;
  status: CreatureStatus;
  happiness?: number;
  hunger?: number;
  reaction?: CreatureReaction;
  /** Color-variant key (e.g. 'ember') or a raw hex string. Purely visual. */
  skin?: string;
  /** Small overlay extras, e.g. ['acc-hat','acc-scarf']. Purely visual. */
  accessories?: string[];
  /** Den background cosmetic id (e.g. 'bg-lantern'). Purely visual. */
  background?: string;
  /** Rendered size in px (square). */
  size?: number;
  onReactionEnd?: () => void;
}

interface Palette {
  body: string;
  shade: string;
  belly: string;
  cheek: string;
  eye: string;
}

const SKINS: Record<string, Palette> = {
  'skin-default': { body: '#ffcf8f', shade: '#e8a862', belly: '#fff1da', cheek: '#ff9d8a', eye: '#3a2418' },
  'skin-moss': { body: '#a9db8f', shade: '#7cb867', belly: '#ecffe0', cheek: '#ff9d8a', eye: '#243a1c' },
  'skin-berry': { body: '#e79ad0', shade: '#c46fb0', belly: '#ffe6f6', cheek: '#ff8fb0', eye: '#3a1830' },
  'skin-frost': { body: '#9fc9ff', shade: '#6fa0e0', belly: '#e8f2ff', cheek: '#ff9d8a', eye: '#1c2a3a' },
  'skin-ash': { body: '#d5c8bb', shade: '#a99a8b', belly: '#f4ede4', cheek: '#e79a8a', eye: '#2e2620' },
  'skin-gold': { body: '#ffdf87', shade: '#e6b84e', belly: '#fff6d8', cheek: '#ff9d8a', eye: '#3a2c10' },
  'skin-dusk': { body: '#b89ad6', shade: '#8a6bb0', belly: '#f0e6ff', cheek: '#d98aa2', eye: '#2a1838' },
  'skin-ocean': { body: '#6ec4c4', shade: '#4a9a9a', belly: '#e0f7f7', cheek: '#ff9d8a', eye: '#1a3030' },
  'skin-rose': { body: '#f0a0a0', shade: '#d07070', belly: '#ffe8e8', cheek: '#ff8fb0', eye: '#3a2020' },
  'skin-mint': { body: '#a8e6cf', shade: '#78c6a8', belly: '#e8fff4', cheek: '#ff9d8a', eye: '#1a3028' },
  'skin-shadow': { body: '#7a6a8a', shade: '#5a4a6a', belly: '#e8e0f0', cheek: '#b89ad6', eye: '#1a1420' },
  'skin-cream': { body: '#fff8e8', shade: '#e8dcc8', belly: '#fffff8', cheek: '#ffd8c8', eye: '#3a3020' },
};

function resolvePalette(skin?: string): Palette {
  if (!skin) return SKINS['skin-default'];
  if (skin.startsWith('#')) {
    return { ...SKINS['skin-default'], body: skin };
  }
  return SKINS[skin] ?? SKINS['skin-default'];
}

interface HeadAnchor {
  cx: number;
  cy: number;
  r: number;
  eyeDx: number;
  eyeR: number;
}

/** Face/accessory anchors per stage (viewBox is 0 0 200 200, ground ~176). */
const HEAD: Record<Exclude<CreatureStage, 'egg'>, HeadAnchor> = {
  baby: { cx: 100, cy: 96, r: 44, eyeDx: 16, eyeR: 9 },
  juvenile: { cx: 100, cy: 82, r: 36, eyeDx: 15, eyeR: 8 },
  adult: { cx: 100, cy: 72, r: 37, eyeDx: 14, eyeR: 7.5 },
  elder: { cx: 100, cy: 74, r: 41, eyeDx: 15, eyeR: 7 },
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function Creature({
  stage,
  species = 'den-sprite',
  status,
  happiness = 100,
  hunger = 100,
  reaction = 'idle',
  skin,
  accessories = [],
  background,
  size = 220,
  onReactionEnd,
}: CreatureProps) {
  const reduce = prefersReducedMotion();
  const colors = resolvePalette(skin);
  const controls = useAnimationControls();
  const [blink, setBlink] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  // Keep the latest callback without re-triggering the reaction effect.
  const onReactionEndRef = useRef(onReactionEnd);
  onReactionEndRef.current = onReactionEnd;

  const isEgg = stage === 'egg';
  const isGone = status === 'gone';

  // --- Occasional blink loop (skipped for egg / gone / reduced-motion) ---
  useEffect(() => {
    if (reduce || isGone || isEgg) return;
    let blinkTimer: ReturnType<typeof setTimeout>;
    let openTimer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      blinkTimer = setTimeout(() => {
        setBlink(true);
        openTimer = setTimeout(() => setBlink(false), 130);
        schedule();
      }, 2400 + Math.random() * 3400);
    };
    schedule();
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(openTimer);
    };
  }, [reduce, isGone, isEgg]);

  // --- Reaction beats (squash & stretch), then hand control back to idle ---
  useEffect(() => {
    if (reaction === 'idle' || isGone) return;

    let cancelled = false;
    const finish = () => {
      if (!cancelled) onReactionEndRef.current?.();
    };

    if (reduce) {
      const t = setTimeout(finish, 220);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const run = async () => {
      if (reaction === 'levelUp') setSparkle(true);
      const [target, transition] = getReaction(reaction, isEgg);
      await controls.start(target, transition);
      controls.set({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 });
      if (reaction === 'levelUp' && !cancelled) setSparkle(false);
      finish();
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [reaction, isEgg, isGone, reduce, controls]);

  const openness = blink
    ? 0.08
    : status === 'critical'
      ? 0.5
      : status === 'sick'
        ? 0.62
        : status === 'hungry'
          ? 0.74
          : 1;

  // Liveliness blends both meters so a full, happy creature glows brightest.
  const liveliness = clamp01((happiness + hunger) / 200);
  const glowStrength =
    status === 'gone'
      ? 0
      : (status === 'happy' ? 0.55 : status === 'critical' ? 0.15 : 0.32) *
        (0.45 + 0.55 * liveliness);

  const statusClass = `creature creature--${status} creature--${stage}`;

  return (
    <div
      className={statusClass}
      data-species={species}
      style={{ width: size, height: size }}
      role="img"
      aria-label={describe(stage, status)}
    >
      <svg className="creature__svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="creatureGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--creature-glow, rgba(255,197,122,0.6))" />
            <stop offset="100%" stopColor="rgba(255,197,122,0)" />
          </radialGradient>
        </defs>

        {/* Ambient glow — pulses gently when the creature is thriving. */}
        {glowStrength > 0 && (
          <motion.ellipse
            cx={100}
            cy={stage === 'baby' || isEgg ? 118 : 108}
            rx={72}
            ry={64}
            fill="url(#creatureGlow)"
            initial={false}
            animate={reduce ? { opacity: glowStrength } : { opacity: [glowStrength * 0.7, glowStrength, glowStrength * 0.7] }}
            transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <DenBackground id={background} />

        <Nest faded={isGone} />

        {isGone ? (
          <GhostOutline reduce={reduce} />
        ) : (
          <StatusShake active={status === 'critical'} reduce={reduce}>
            <IdleBreath isEgg={isEgg} reduce={reduce}>
              <motion.g
                style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
                animate={controls}
                initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }}
              >
                {isEgg ? (
                  <Egg colors={colors} />
                ) : (
                  <>
                    <Body stage={stage} colors={colors} />
                    <Face
                      anchor={HEAD[stage]}
                      colors={colors}
                      openness={openness}
                      status={status}
                      reaction={reaction}
                      stage={stage}
                    />
                    {accessories.map((a) => (
                      <Accessory key={a} name={a} anchor={HEAD[stage]} />
                    ))}
                  </>
                )}
              </motion.g>
            </IdleBreath>
          </StatusShake>
        )}

        <AnimatePresence>{sparkle && <Sparkles key="sparkles" />}</AnimatePresence>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Motion wrappers                                                         */
/* ---------------------------------------------------------------------- */

function IdleBreath({
  children,
  isEgg,
  reduce,
}: {
  children: React.ReactNode;
  isEgg: boolean;
  reduce: boolean;
}) {
  if (reduce) {
    return <g>{children}</g>;
  }
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
      animate={
        isEgg
          ? { rotate: [-2.2, 2.2, -2.2] }
          : { scaleY: [1, 1.04, 1], scaleX: [1, 0.99, 1.005, 1], y: [0, -2, 0] }
      }
      transition={{ duration: isEgg ? 4.2 : 3.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.g>
  );
}

function StatusShake({
  children,
  active,
  reduce,
}: {
  children: React.ReactNode;
  active: boolean;
  reduce: boolean;
}) {
  if (!active || reduce) {
    return <g>{children}</g>;
  }
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
      animate={{ x: [0, -1.6, 1.6, -1.1, 1.1, 0], rotate: [0, -0.7, 0.7, -0.4, 0] }}
      transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.g>
  );
}

/* ---------------------------------------------------------------------- */
/* Reaction definitions                                                    */
/* ---------------------------------------------------------------------- */

type ReactionTarget = {
  y?: number[];
  scaleX?: number[];
  scaleY?: number[];
  rotate?: number[];
};

function getReaction(
  reaction: Exclude<CreatureReaction, 'idle'>,
  isEgg: boolean,
): [ReactionTarget, Transition] {
  if (isEgg) {
    // The egg can only wobble — a little tease of the life inside.
    switch (reaction) {
      case 'bigCorrect':
      case 'levelUp':
        return [{ rotate: [0, -9, 9, -6, 6, 0], y: [0, -4, 0] }, { duration: 0.7, ease: 'easeInOut' }];
      case 'forgot':
        return [{ rotate: [0, -3, 3, 0] }, { duration: 0.5, ease: 'easeInOut' }];
      default:
        return [{ rotate: [0, -6, 6, 0], y: [0, -2, 0] }, { duration: 0.5, ease: 'easeInOut' }];
    }
  }

  switch (reaction) {
    case 'correct':
      return [
        { y: [0, -16, 0], scaleX: [1, 0.96, 1.05, 1], scaleY: [1, 1.08, 0.96, 1] },
        { duration: 0.5, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.35, 1] },
      ];
    case 'bigCorrect':
      return [
        {
          y: [0, -30, 0, -12, 0],
          scaleX: [1, 0.88, 1.12, 0.96, 1.03, 1],
          scaleY: [1, 1.2, 0.86, 1.08, 0.98, 1],
        },
        { duration: 0.82, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.22, 0.5, 0.7, 0.86, 1] },
      ];
    case 'eat':
      return [
        {
          y: [0, 4, 0, 3, 0],
          scaleX: [1, 1.08, 0.94, 1.05, 1],
          scaleY: [1, 0.9, 1.06, 0.95, 1],
        },
        { duration: 0.66, ease: 'easeInOut', times: [0, 0.2, 0.45, 0.7, 1] },
      ];
    case 'levelUp':
      return [
        {
          y: [0, -10, -4, 0],
          scaleX: [1, 1.1, 1.16, 1],
          scaleY: [1, 1.14, 1.2, 1],
          rotate: [0, -3, 3, 0],
        },
        { duration: 0.9, ease: [0.34, 1.56, 0.64, 1], times: [0, 0.4, 0.7, 1] },
      ];
    case 'forgot':
      // Calm, acknowledging dip — a small nod, never a sad slump.
      return [
        { y: [0, 7, 2, 0], scaleY: [1, 0.94, 1.01, 1], scaleX: [1, 1.03, 0.99, 1] },
        { duration: 0.62, ease: 'easeInOut', times: [0, 0.4, 0.7, 1] },
      ];
  }
}

/* ---------------------------------------------------------------------- */
/* Scenery                                                                 */
/* ---------------------------------------------------------------------- */

function DenBackground({ id }: { id?: string }) {
  if (!id || id === 'bg-nest') return null;

  switch (id) {
    case 'bg-lantern':
      return (
        <g opacity={0.85}>
          <line x1={100} y1={8} x2={100} y2={28} stroke="#8a6a40" strokeWidth={2} />
          <rect x={88} y={28} width={24} height={18} rx={4} fill="#ffc96b" opacity={0.9} />
          <ellipse cx={100} cy={46} rx={40} ry={30} fill="#ffc96b" opacity={0.15} />
        </g>
      );
    case 'bg-mushroom':
      return (
        <g opacity={0.9}>
          <ellipse cx={42} cy={168} rx={10} ry={6} fill="#c46fb0" opacity={0.7} />
          <rect x={38} y={168} width={8} height={10} rx={2} fill="#e8dcc8" />
          <ellipse cx={158} cy={172} rx={8} ry={5} fill="#9fc9ff" opacity={0.8} />
          <rect x={155} y={172} width={6} height={8} rx={2} fill="#e8dcc8" />
          <ellipse cx={100} cy={175} rx={6} ry={4} fill="#a9db8f" opacity={0.7} />
          <circle cx={42} cy={165} r={3} fill="#fff" opacity={0.5} />
          <circle cx={158} cy={169} r={2.5} fill="#fff" opacity={0.5} />
        </g>
      );
    case 'bg-stars':
      return (
        <g fill="#fff" opacity={0.7}>
          {[
            { x: 30, y: 24, r: 1.5 },
            { x: 60, y: 16, r: 1 },
            { x: 140, y: 20, r: 1.2 },
            { x: 170, y: 32, r: 1 },
            { x: 50, y: 40, r: 0.8 },
            { x: 155, y: 48, r: 0.9 },
            { x: 85, y: 12, r: 1.3 },
          ].map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} />
          ))}
        </g>
      );
    case 'bg-aurora':
      return (
        <g opacity={0.35}>
          <path d="M0 60 Q50 40 100 55 T200 50 L200 90 Q100 70 0 85 Z" fill="#9fc9ff" />
          <path d="M0 70 Q60 55 120 68 T200 62 L200 100 Q80 85 0 95 Z" fill="#b89ad6" />
          <path d="M0 80 Q40 72 80 78 T200 75 L200 110 Q100 95 0 105 Z" fill="#a9db8f" />
        </g>
      );
    case 'bg-meadow':
      return (
        <g opacity={0.8}>
          <rect x={0} y={160} width={200} height={40} fill="#7cb867" opacity={0.3} />
          {[35, 55, 75, 125, 145, 165].map((x, i) => (
            <g key={i}>
              <line x1={x} y1={168} x2={x - 3} y2={158} stroke="#a9db8f" strokeWidth={2} strokeLinecap="round" />
              <circle cx={x + 4} cy={162} r={3} fill={['#e79ad0', '#ffc96b', '#b89ad6'][i % 3]} opacity={0.8} />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

function Nest({ faded }: { faded: boolean }) {
  const op = faded ? 0.5 : 1;
  return (
    <g opacity={op}>
      <ellipse cx={100} cy={178} rx={62} ry={16} fill="var(--nest-shadow, #5c3d24)" />
      <path
        d="M40 176 Q100 150 160 176 Q150 192 100 192 Q50 192 40 176 Z"
        fill="var(--nest, #7a5433)"
      />
      {/* woven twig strokes */}
      <path d="M48 176 Q100 158 152 176" stroke="var(--nest-shadow, #5c3d24)" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
      <path d="M56 182 Q100 168 144 182" stroke="var(--nest-shadow, #5c3d24)" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.45} />
    </g>
  );
}

function GhostOutline({ reduce }: { reduce: boolean }) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={reduce ? { opacity: 0.5 } : { opacity: [0.28, 0.5, 0.28] }}
      transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* a soft, faded "was here" outline — gentle, never morbid */}
      <ellipse
        cx={100}
        cy={120}
        rx={40}
        ry={44}
        fill="none"
        stroke="var(--text-muted, #b6a08f)"
        strokeWidth={2.5}
        strokeDasharray="5 9"
        strokeLinecap="round"
      />
      <path
        d="M86 118 q6 -7 14 0"
        stroke="var(--text-muted, #b6a08f)"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </motion.g>
  );
}

function Sparkles() {
  const stars = [
    { x: 58, y: 60, d: 0 },
    { x: 142, y: 66, d: 0.1 },
    { x: 100, y: 34, d: 0.2 },
    { x: 74, y: 40, d: 0.28 },
    { x: 132, y: 44, d: 0.16 },
  ];
  return (
    <g>
      {stars.map((s, i) => (
        <motion.path
          key={i}
          d={`M${s.x} ${s.y - 7} L${s.x + 2} ${s.y - 2} L${s.x + 7} ${s.y} L${s.x + 2} ${s.y + 2} L${s.x} ${s.y + 7} L${s.x - 2} ${s.y + 2} L${s.x - 7} ${s.y} L${s.x - 2} ${s.y - 2} Z`}
          fill="var(--accent-peach, #ffb98a)"
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ scale: [0, 1.1, 0], opacity: [0, 1, 0], rotate: 90 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, delay: s.d, ease: 'easeOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
    </g>
  );
}

/* ---------------------------------------------------------------------- */
/* Bodies (distinct silhouette per stage)                                  */
/* ---------------------------------------------------------------------- */

function Egg({ colors }: { colors: Palette }) {
  return (
    <g>
      <path
        d="M100 96 C74 96 62 138 62 152 C62 172 80 184 100 184 C120 184 138 172 138 152 C138 138 126 96 100 96 Z"
        fill="var(--egg-shell, #f3ddc0)"
      />
      <path
        d="M100 96 C86 96 78 118 76 140 C88 132 96 132 100 132 Z"
        fill="#ffffff"
        opacity={0.35}
      />
      {/* speckles */}
      <circle cx={86} cy={150} r={4} fill="var(--egg-speckle, #c79a6e)" opacity={0.8} />
      <circle cx={112} cy={140} r={3} fill="var(--egg-speckle, #c79a6e)" opacity={0.7} />
      <circle cx={106} cy={166} r={3.4} fill="var(--egg-speckle, #c79a6e)" opacity={0.7} />
      <circle cx={90} cy={172} r={2.6} fill="var(--egg-speckle, #c79a6e)" opacity={0.6} />
      {/* a hint of warmth inside */}
      <ellipse cx={100} cy={150} rx={20} ry={24} fill={colors.body} opacity={0.12} />
    </g>
  );
}

function Feet({ y, dx, colors }: { y: number; dx: number; colors: Palette }) {
  return (
    <g fill={colors.shade}>
      <ellipse cx={100 - dx} cy={y} rx={13} ry={7} />
      <ellipse cx={100 + dx} cy={y} rx={13} ry={7} />
    </g>
  );
}

function Body({ stage, colors }: { stage: Exclude<CreatureStage, 'egg'>; colors: Palette }) {
  switch (stage) {
    case 'baby':
      return (
        <g>
          <Feet y={166} dx={20} colors={colors} />
          {/* one big round blob — mostly head */}
          <ellipse cx={100} cy={104} rx={50} ry={52} fill={colors.body} />
          <ellipse cx={100} cy={118} rx={30} ry={30} fill={colors.belly} opacity={0.9} />
          {/* a single sprout on top */}
          <path d="M100 54 q-3 -14 6 -20 q2 12 -6 20 Z" fill={colors.shade} />
          <circle cx={106} cy={35} r={4} fill={colors.cheek} />
        </g>
      );
    case 'juvenile':
      return (
        <g>
          <Feet y={168} dx={22} colors={colors} />
          {/* small ears */}
          <path d="M74 60 q-6 -26 12 -30 q4 20 -4 34 Z" fill={colors.body} />
          <path d="M126 60 q6 -26 -12 -30 q-4 20 4 34 Z" fill={colors.body} />
          {/* body */}
          <ellipse cx={100} cy={124} rx={44} ry={40} fill={colors.body} />
          {/* head */}
          <circle cx={100} cy={82} r={40} fill={colors.body} />
          <ellipse cx={100} cy={130} rx={26} ry={26} fill={colors.belly} opacity={0.9} />
          {/* stubby arms */}
          <ellipse cx={60} cy={122} rx={11} ry={8} fill={colors.shade} />
          <ellipse cx={140} cy={122} rx={11} ry={8} fill={colors.shade} />
        </g>
      );
    case 'adult':
      return (
        <g>
          <Feet y={172} dx={24} colors={colors} />
          {/* tall pointed ears */}
          <path d="M72 46 q-10 -34 8 -40 q10 22 2 44 Z" fill={colors.body} />
          <path d="M128 46 q10 -34 -8 -40 q-10 22 -2 44 Z" fill={colors.body} />
          <path d="M74 42 q-5 -22 6 -28 q5 14 0 28 Z" fill={colors.shade} opacity={0.6} />
          {/* body (tall, poised) */}
          <ellipse cx={100} cy={130} rx={42} ry={46} fill={colors.body} />
          {/* head */}
          <circle cx={100} cy={72} r={38} fill={colors.body} />
          <ellipse cx={100} cy={136} rx={26} ry={30} fill={colors.belly} opacity={0.9} />
          {/* flame tuft */}
          <path d="M100 32 q-8 -12 0 -22 q8 10 0 22 Z" fill={colors.cheek} />
          {/* arms */}
          <ellipse cx={56} cy={126} rx={12} ry={9} fill={colors.shade} />
          <ellipse cx={144} cy={126} rx={12} ry={9} fill={colors.shade} />
        </g>
      );
    case 'elder':
      return (
        <g>
          <Feet y={172} dx={26} colors={colors} />
          {/* long droopy ears */}
          <path d="M66 62 q-22 -6 -26 14 q18 8 30 -4 Z" fill={colors.body} />
          <path d="M134 62 q22 -6 26 14 q-18 8 -30 -4 Z" fill={colors.body} />
          {/* large rounded body */}
          <ellipse cx={100} cy={128} rx={50} ry={44} fill={colors.body} />
          {/* head */}
          <circle cx={100} cy={74} r={42} fill={colors.body} />
          <ellipse cx={100} cy={134} rx={30} ry={30} fill={colors.belly} opacity={0.9} />
          {/* brow tufts */}
          <path d="M76 52 q6 -10 16 -6" stroke={colors.shade} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M124 52 q-6 -10 -16 -6" stroke={colors.shade} strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* soft chin tuft (wise beard) */}
          <path d="M88 104 q12 22 24 0 q-4 16 -12 18 q-8 -2 -12 -18 Z" fill={colors.belly} opacity={0.85} />
          {/* arms */}
          <ellipse cx={52} cy={128} rx={12} ry={10} fill={colors.shade} />
          <ellipse cx={148} cy={128} rx={12} ry={10} fill={colors.shade} />
        </g>
      );
  }
}

/* ---------------------------------------------------------------------- */
/* Face + accessories                                                      */
/* ---------------------------------------------------------------------- */

function Face({
  anchor,
  colors,
  openness,
  status,
  reaction,
  stage,
}: {
  anchor: HeadAnchor;
  colors: Palette;
  openness: number;
  status: CreatureStatus;
  reaction: CreatureReaction;
  stage: Exclude<CreatureStage, 'egg'>;
}) {
  const { cx, eyeDx, eyeR } = anchor;
  const eyeY = anchor.cy - eyeR * 0.4;
  const ry = Math.max(0.8, eyeR * openness);
  const showHighlight = openness > 0.4;
  const mouthY = eyeY + eyeR + 9;
  const eating = reaction === 'eat';

  return (
    <g>
      {/* cheeks (rosy when well) */}
      {status !== 'sick' && status !== 'critical' && (
        <g fill={colors.cheek} opacity={0.55}>
          <ellipse cx={cx - eyeDx - 6} cy={eyeY + eyeR + 2} rx={7} ry={4.5} />
          <ellipse cx={cx + eyeDx + 6} cy={eyeY + eyeR + 2} rx={7} ry={4.5} />
        </g>
      )}

      {/* eyes */}
      {openness <= 0.12 ? (
        <g stroke={colors.eye} strokeWidth={3} strokeLinecap="round">
          <path d={`M${cx - eyeDx - eyeR + 1} ${eyeY} q${eyeR - 1} ${eyeR * 0.7} ${(eyeR - 1) * 2} 0`} fill="none" />
          <path d={`M${cx + eyeDx - eyeR + 1} ${eyeY} q${eyeR - 1} ${eyeR * 0.7} ${(eyeR - 1) * 2} 0`} fill="none" />
        </g>
      ) : (
        <g fill={colors.eye}>
          <ellipse cx={cx - eyeDx} cy={eyeY} rx={eyeR * 0.82} ry={ry} />
          <ellipse cx={cx + eyeDx} cy={eyeY} rx={eyeR * 0.82} ry={ry} />
          {showHighlight && (
            <g fill="#ffffff">
              <circle cx={cx - eyeDx + eyeR * 0.3} cy={eyeY - eyeR * 0.35} r={eyeR * 0.28} />
              <circle cx={cx + eyeDx + eyeR * 0.3} cy={eyeY - eyeR * 0.35} r={eyeR * 0.28} />
            </g>
          )}
        </g>
      )}

      {/* worried brows for critical */}
      {status === 'critical' && (
        <g stroke={colors.eye} strokeWidth={2.5} strokeLinecap="round">
          <path d={`M${cx - eyeDx - eyeR} ${eyeY - eyeR - 3} q${eyeR} -3 ${eyeR * 1.4} 3`} fill="none" />
          <path d={`M${cx + eyeDx + eyeR} ${eyeY - eyeR - 3} q${-eyeR} -3 ${-eyeR * 1.4} 3`} fill="none" />
        </g>
      )}

      {/* mouth */}
      <Mouth cx={cx} y={mouthY} status={status} eating={eating} eye={colors.eye} cheek={colors.cheek} />

      {/* a small sweat bead conveys urgency without being morbid */}
      {status === 'critical' && (
        <path
          d={`M${cx + eyeDx + eyeR + 6} ${eyeY - 2} q4 8 0 12 q-4 -4 0 -12 Z`}
          fill="#8fd0ff"
          opacity={0.85}
        />
      )}

      {/* elder gets a couple of whisker tufts */}
      {stage === 'elder' && (
        <g stroke={colors.shade} strokeWidth={2} strokeLinecap="round" opacity={0.7}>
          <path d={`M${cx - eyeDx - 14} ${mouthY - 1} q-10 -1 -16 3`} fill="none" />
          <path d={`M${cx + eyeDx + 14} ${mouthY - 1} q10 -1 16 3`} fill="none" />
        </g>
      )}
    </g>
  );
}

function Mouth({
  cx,
  y,
  status,
  eating,
  eye,
  cheek,
}: {
  cx: number;
  y: number;
  status: CreatureStatus;
  eating: boolean;
  eye: string;
  cheek: string;
}) {
  if (eating) {
    return (
      <g>
        <ellipse cx={cx} cy={y + 2} rx={9} ry={8} fill={eye} />
        <ellipse cx={cx} cy={y + 5} rx={5} ry={3} fill={cheek} />
      </g>
    );
  }
  switch (status) {
    case 'happy':
      return (
        <path d={`M${cx - 11} ${y} q11 12 22 0`} stroke={eye} strokeWidth={3} fill="none" strokeLinecap="round" />
      );
    case 'hungry':
      return <ellipse cx={cx} cy={y + 1} rx={5} ry={4} fill={eye} />;
    case 'sick':
      return (
        <path
          d={`M${cx - 10} ${y + 1} q5 -5 10 0 q5 5 10 0`}
          stroke={eye}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
      );
    case 'critical':
      return <ellipse cx={cx} cy={y + 2} rx={6} ry={5} fill={eye} />;
    default:
      return (
        <path d={`M${cx - 9} ${y} q9 7 18 0`} stroke={eye} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      );
  }
}

function Accessory({ name, anchor }: { name: string; anchor: HeadAnchor }) {
  const { cx, cy, r } = anchor;
  const topY = cy - r;
  switch (name) {
    case 'acc-hat':
      return (
        <g>
          <path d={`M${cx - 20} ${topY + 4} L${cx} ${topY - 30} L${cx + 20} ${topY + 4} Z`} fill="var(--accent-berry, #d98aa2)" />
          <circle cx={cx} cy={topY - 30} r={5} fill="var(--accent-peach, #ffb98a)" />
          <rect x={cx - 22} y={topY} width={44} height={7} rx={3.5} fill="var(--accent-peach, #ffb98a)" />
        </g>
      );
    case 'acc-crown':
      return (
        <path
          d={`M${cx - 22} ${topY + 6} L${cx - 22} ${topY - 12} L${cx - 11} ${topY - 2} L${cx} ${topY - 16} L${cx + 11} ${topY - 2} L${cx + 22} ${topY - 12} L${cx + 22} ${topY + 6} Z`}
          fill="var(--warning, #ffc96b)"
          stroke="#c99320"
          strokeWidth={1.5}
        />
      );
    case 'acc-bow':
      return (
        <g fill="var(--accent-berry, #d98aa2)" transform={`translate(${cx - r + 4}, ${topY + 4})`}>
          <path d="M0 0 L-12 -7 L-12 7 Z" />
          <path d="M0 0 L12 -7 L12 7 Z" />
          <circle cx={0} cy={0} r={4} fill="var(--accent-peach, #ffb98a)" />
        </g>
      );
    case 'acc-flower':
      return (
        <g transform={`translate(${cx + r - 6}, ${topY + 8})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx={0}
              cy={-7}
              rx={4}
              ry={6}
              fill="var(--accent-lilac, #b79ad6)"
              transform={`rotate(${a})`}
            />
          ))}
          <circle cx={0} cy={0} r={4} fill="var(--warning, #ffc96b)" />
        </g>
      );
    case 'acc-scarf':
      return (
        <g fill="var(--secondary, #6fb6a6)">
          <rect x={cx - r} y={cy + r - 6} width={r * 2} height={12} rx={6} />
          <path d={`M${cx + r - 12} ${cy + r - 2} l14 22 l-11 3 l-9 -20 Z`} />
        </g>
      );
    case 'acc-glasses':
      return (
        <g stroke="var(--text, #f6ead8)" strokeWidth={2.5} fill="none">
          <circle cx={cx - anchor.eyeDx} cy={cy - anchor.eyeR * 0.4} r={anchor.eyeR + 2} />
          <circle cx={cx + anchor.eyeDx} cy={cy - anchor.eyeR * 0.4} r={anchor.eyeR + 2} />
          <path d={`M${cx - anchor.eyeDx + anchor.eyeR + 2} ${cy - anchor.eyeR * 0.4} h${2 * anchor.eyeDx - 2 * (anchor.eyeR + 2)}`} />
        </g>
      );
    case 'acc-halo':
      return (
        <ellipse
          cx={cx}
          cy={topY - 18}
          rx={22}
          ry={6}
          fill="none"
          stroke="var(--warning, #ffc96b)"
          strokeWidth={3}
          opacity={0.85}
        />
      );
    case 'acc-horns':
      return (
        <g fill="var(--accent-berry, #d98aa2)">
          <path d={`M${cx - 14} ${topY + 2} q-8 -18 -4 -28 q6 10 4 28 Z`} />
          <path d={`M${cx + 14} ${topY + 2} q8 -18 4 -28 q-6 10 -4 28 Z`} />
        </g>
      );
    case 'acc-antenna':
      return (
        <g stroke="var(--accent-lilac, #b79ad6)" strokeWidth={2.5} strokeLinecap="round" fill="var(--warning, #ffc96b)">
          <path d={`M${cx - 8} ${topY + 4} q-6 -20 -2 -32`} fill="none" />
          <path d={`M${cx + 8} ${topY + 4} q6 -20 2 -32`} fill="none" />
          <circle cx={cx - 10} cy={topY - 28} r={3.5} />
          <circle cx={cx + 10} cy={topY - 28} r={3.5} />
        </g>
      );
    case 'acc-headphones':
      return (
        <g>
          <path
            d={`M${cx - anchor.eyeDx - 14} ${cy - 4} q-8 -16 0 -28 q8 4 8 16 v8 q-8 0 -8 -8`}
            fill="none"
            stroke="#5a4a6a"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d={`M${cx + anchor.eyeDx + 14} ${cy - 4} q8 -16 0 -28 q-8 4 -8 16 v8 q8 0 8 -8`}
            fill="none"
            stroke="#5a4a6a"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <rect x={cx - anchor.eyeDx - 18} y={cy - 8} width={10} height={16} rx={4} fill="#6fb6a6" />
          <rect x={cx + anchor.eyeDx + 8} y={cy - 8} width={10} height={16} rx={4} fill="#6fb6a6" />
        </g>
      );
    case 'acc-wings':
      return (
        <g opacity={0.85}>
          <ellipse cx={cx - r - 8} cy={cy + 10} rx={18} ry={28} fill="#b79ad6" transform={`rotate(-20 ${cx - r - 8} ${cy + 10})`} />
          <ellipse cx={cx + r + 8} cy={cy + 10} rx={18} ry={28} fill="#b79ad6" transform={`rotate(20 ${cx + r + 8} ${cy + 10})`} />
        </g>
      );
    case 'acc-star-pin':
      return (
        <g transform={`translate(${cx + r - 4}, ${topY + 12})`} fill="var(--warning, #ffc96b)">
          <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" />
        </g>
      );
    case 'acc-leaf-crown':
      return (
        <g fill="#7cb867" stroke="#5a9040" strokeWidth={1}>
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
            <ellipse
              key={a}
              cx={cx}
              cy={topY - 4}
              rx={5}
              ry={10}
              transform={`rotate(${a} ${cx} ${topY - 4})`}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function describe(stage: CreatureStage, status: CreatureStatus): string {
  if (status === 'gone') return 'An empty nest';
  if (stage === 'egg') return 'A speckled egg resting in a nest';
  return `A ${status} ${stage} den sprite`;
}
