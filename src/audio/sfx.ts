/**
 * sfx — a tiny Web Audio sound engine with zero asset files.
 *
 * Every cue is synthesized on the fly from oscillators + gain envelopes, so the
 * whole thing ships as a few KB of code and works fully offline. Cues are short,
 * warm, and pleasant — wins feel good, "forgot" is calm and never punishing.
 *
 * Usage:
 *   sfx.setMuted(!prefs.soundEnabled);   // app pushes the user's pref in
 *   sfx.warmup();                        // pre-create AudioContext on first tap
 *   sfx.play('hitEasy');                 // fire a cue (lazy-inits the context)
 *   sfx.vibrate(20);                     // optional haptic (feature-detected)
 *
 * The AudioContext is created lazily on the first `play()` so it can attach to a
 * user gesture (browser autoplay policy). Muting is checked at play time.
 */

export type SfxName =
  | 'hitStruggled'
  | 'hitEasy'
  | 'forgot'
  | 'feed'
  | 'levelUp'
  | 'reward'
  | 'purchase'
  | 'milestone';

type OscType = 'sine' | 'triangle' | 'square' | 'sawtooth';

interface ToneOptions {
  type?: OscType;
  /** Peak gain (0..1) before the master gain. */
  gain?: number;
  /** Seconds from note start to peak. */
  attack?: number;
  /** Seconds of exponential decay/release after peak. */
  release?: number;
  /** Optional frequency to glide toward across the note (Hz). */
  sweepTo?: number;
  /** Optional lowpass cutoff (Hz) to soften brightness. */
  lowpass?: number;
}

/** Window shape augmented with the legacy webkit-prefixed constructor. */
interface AudioWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  /** Mute/unmute all cues. The app wires this to the user's soundEnabled pref. */
  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Fire a haptic pattern if the device + browser support it. Silently no-ops
   * otherwise. The app gates this on the user's hapticsEnabled pref before call.
   */
  vibrate(pattern: number | number[]): void {
    if (typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate !== 'function') return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* some browsers throw if called without a user gesture — ignore */
    }
  }

  /**
   * Pre-create and resume the AudioContext on a user gesture so the first real
   * cue plays without perceptible lag. Safe to call multiple times.
   */
  warmup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
  }

  /** Play a named cue. Lazily creates the AudioContext on first use. */
  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Autoplay policy: resume if the context was created while suspended.
    if (ctx.state === 'suspended') void ctx.resume();

    const t = ctx.currentTime;
    switch (name) {
      case 'hitStruggled':
        // A soft, satisfying little plink — a win, but a modest one.
        this.tone(523.25, t, 0.16, { type: 'triangle', gain: 0.18, release: 0.16 });
        break;
      case 'hitEasy':
        // Brighter and bigger than struggled: a quick rising two-note skip.
        this.tone(659.25, t, 0.12, { type: 'triangle', gain: 0.22, release: 0.12 });
        this.tone(987.77, t + 0.09, 0.2, { type: 'triangle', gain: 0.2, release: 0.2 });
        break;
      case 'forgot':
        // Calm, warm, non-punishing: a gentle low sine that dips a touch.
        this.tone(392.0, t, 0.34, {
          type: 'sine',
          gain: 0.14,
          attack: 0.03,
          release: 0.32,
          sweepTo: 329.63,
          lowpass: 900,
        });
        break;
      case 'feed':
        // A soft chomp/gulp: quick downward pitch blip, rounded off.
        this.tone(300, t, 0.1, { type: 'square', gain: 0.16, release: 0.1, sweepTo: 140, lowpass: 700 });
        this.tone(190, t + 0.1, 0.14, { type: 'sine', gain: 0.16, release: 0.14, sweepTo: 120 });
        break;
      case 'levelUp':
        // Celebratory ascending arpeggio landing on the octave.
        this.arpeggio([523.25, 659.25, 783.99, 1046.5], t, 0.1, {
          type: 'triangle',
          gain: 0.22,
          release: 0.22,
        });
        break;
      case 'reward': {
        // Variable-reward sparkle — randomized each time so it never feels rote.
        const base = 880 + Math.random() * 120;
        const notes = [base, base * 1.25, base * 1.5, base * (Math.random() > 0.5 ? 2 : 1.75)];
        this.arpeggio(notes, t, 0.07, { type: 'sine', gain: 0.16, release: 0.18 });
        break;
      }
      case 'purchase':
        // A pleasant "settled" two-note confirm with a little shimmer on top.
        this.tone(659.25, t, 0.12, { type: 'triangle', gain: 0.2, release: 0.12 });
        this.tone(880.0, t + 0.09, 0.18, { type: 'triangle', gain: 0.2, release: 0.18 });
        this.tone(1760.0, t + 0.09, 0.16, { type: 'sine', gain: 0.07, release: 0.16 });
        break;
      case 'milestone':
        // A fuller little fanfare: rising notes plus a soft supporting chord.
        this.arpeggio([523.25, 659.25, 783.99], t, 0.11, {
          type: 'triangle',
          gain: 0.2,
          release: 0.22,
        });
        this.tone(1046.5, t + 0.33, 0.4, { type: 'sine', gain: 0.16, release: 0.4 });
        this.tone(1318.51, t + 0.33, 0.4, { type: 'sine', gain: 0.1, release: 0.4 });
        break;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    const w = window as unknown as AudioWindow;
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  /** Schedule a single enveloped tone. */
  private tone(freq: number, start: number, duration: number, opts: ToneOptions = {}): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const { type = 'sine', gain = 0.2, attack = 0.008, release = duration, sweepTo, lowpass } = opts;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);

    let tail: AudioNode = env;
    if (lowpass !== undefined) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      env.connect(filter);
      tail = filter;
    }

    osc.connect(env);
    tail.connect(master);

    osc.start(start);
    osc.stop(start + attack + release + 0.02);
  }

  /** Play a run of tones one after another. */
  private arpeggio(freqs: number[], start: number, step: number, opts: ToneOptions = {}): void {
    freqs.forEach((freq, i) => {
      const noteStart = start + i * step;
      const dur = opts.release ?? step * 1.6;
      this.tone(freq, noteStart, dur, opts);
    });
  }
}

/** App-wide singleton. Import and use directly. */
export const sfx = new SoundEngine();
