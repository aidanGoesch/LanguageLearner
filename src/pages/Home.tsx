import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { QuickAddCard } from '../components/QuickAddCard';
import { Creature } from '../components/Creature';
import {
  getAllCards,
  getAllReviewLogs,
  getAllStacks,
  getCreature,
  getProfile,
  getSettings,
  updateCreature,
} from '../db';
import { createCard } from '../db/cards';
import { countNewCardsStudiedToday, countReadyToStudy } from '../fsrs/queue';
import { createNewCardFields } from '../utils/cards';
import {
  adoptCreature,
  applyHungerDecay,
  checkDeparture,
  statusMessage,
  stageLabel,
  xpProgress,
} from '../game';
import { streakGateForNext } from '../game/evolution';
import { riseIn, springSoft } from '../ui/motion';
import type { Creature as CreatureType, Profile, Stack } from '../types';
import './Home.css';

export function Home() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [sessionCap, setSessionCap] = useState(20);
  const [added, setAdded] = useState(false);
  const [creature, setCreature] = useState<CreatureType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adoptName, setAdoptName] = useState('');
  const [showAdopt, setShowAdopt] = useState(false);

  const load = useCallback(async () => {
    const [allStacks, allCards, logs, settings, prof, crit] = await Promise.all([
      getAllStacks(),
      getAllCards(),
      getAllReviewLogs(),
      getSettings(),
      getProfile(),
      getCreature(),
    ]);
    setStacks(allStacks);
    const newToday = countNewCardsStudiedToday(logs);
    setDueCount(countReadyToStudy(allCards, settings, newToday));
    setSessionCap(settings.cardsPerSession);
    setProfile(prof);

    let updated = applyHungerDecay(crit);
    updated = checkDeparture(updated, prof);
    if (updated !== crit) await updateCreature(updated);
    setCreature(updated);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuickAdd = async (data: { term: string; definition: string; stackId: string }) => {
    await createCard(createNewCardFields(data.stackId, data.term, data.definition));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    await load();
  };

  const handleAdopt = async () => {
    const egg = adoptCreature(adoptName || 'Pip');
    await updateCreature(egg);
    setCreature(egg);
    setShowAdopt(false);
    setAdoptName('');
  };

  if (!creature || !profile) {
    return (
      <Layout>
        <p className="home__loading">Warming the den…</p>
      </Layout>
    );
  }

  const xp = xpProgress(creature);
  const nextStreakGate = streakGateForNext(creature);
  const urgent = creature.status === 'critical' || creature.status === 'sick';

  return (
    <Layout>
      <div className="home">
        <motion.section className="home__den" variants={riseIn} initial="hidden" animate="visible">
          <div className="home__stats-row">
            <div className="home__stat-pill">
              <span className="home__stat-icon">🔥</span>
              <span>{profile.currentStreak} day{profile.currentStreak !== 1 ? 's' : ''}</span>
            </div>
            {profile.freezesAvailable > 0 && (
              <div className="home__stat-pill home__stat-pill--freeze">
                <span className="home__stat-icon">❄️</span>
                <span>{profile.freezesAvailable} freeze{profile.freezesAvailable !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="home__stat-pill home__stat-pill--coins">
              <span className="home__stat-icon">◎</span>
              <span>{profile.coins}</span>
            </div>
          </div>

          <div className={`home__creature-stage ${urgent ? 'home__creature-stage--urgent' : ''}`}>
            <Creature
              stage={creature.stage}
              status={creature.status}
              skin={creature.cosmetics.skin}
              accessories={creature.cosmetics.accessories}
              background={creature.cosmetics.background}
              size={220}
            />
            <div className="home__creature-info">
              <h1 className="home__creature-name">{creature.name}</h1>
              <p className="home__creature-stage-label">{stageLabel(creature.stage)}</p>
              <p className="home__creature-status">{statusMessage(creature)}</p>
              {creature.status !== 'gone' && (
                <div className="home__bars">
                  <div className="home__bar">
                    <span>Hunger</span>
                    <div className="home__bar-track">
                      <motion.div
                        className="home__bar-fill home__bar-fill--hunger"
                        initial={{ width: 0 }}
                        animate={{ width: `${creature.hunger}%` }}
                        transition={springSoft}
                      />
                    </div>
                  </div>
                  <div className="home__bar">
                    <span>XP</span>
                    <div className="home__bar-track">
                      <motion.div
                        className="home__bar-fill home__bar-fill--xp"
                        initial={{ width: 0 }}
                        animate={{ width: `${xp.ratio * 100}%` }}
                        transition={springSoft}
                      />
                    </div>
                  </div>
                  {nextStreakGate != null && xp.needed > 0 && (
                    <p className="home__gate-hint">
                      {xp.current >= xp.needed
                        ? `XP ready! Reach a ${nextStreakGate}-day streak to evolve (${profile.currentStreak}/${nextStreakGate}).`
                        : `Next evolution: ${Math.max(0, xp.needed - xp.current)} XP & ${nextStreakGate}-day streak.`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {creature.status === 'gone' ? (
            <div className="home__adopt">
              {!showAdopt ? (
                <>
                  <p className="home__adopt-text">The nest is empty, but hope hatches cheap.</p>
                  <button type="button" className="btn btn--primary btn--block" onClick={() => setShowAdopt(true)}>
                    Adopt a new egg
                  </button>
                </>
              ) : (
                <>
                  <label className="form__label">
                    Name your egg
                    <input
                      className="form__input"
                      value={adoptName}
                      onChange={(e) => setAdoptName(e.target.value)}
                      placeholder="Pip"
                    />
                  </label>
                  <button type="button" className="btn btn--primary btn--block" onClick={handleAdopt}>
                    Welcome home
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="home__due">
                {dueCount > 0
                  ? dueCount > sessionCap
                    ? `${dueCount} cards waiting · ${sessionCap} per session`
                    : `${dueCount} card${dueCount !== 1 ? 's' : ''} rustling in the queue`
                  : 'All caught up for now — den is peaceful'}
              </p>
              <Link to="/study" className="btn btn--primary btn--block btn--lg home__study-cta">
                {dueCount > 0 ? 'Study now' : 'Review anyway'}
              </Link>
              <Link to="/shop" className="btn btn--secondary btn--block">
                Visit shop
              </Link>
            </>
          )}
        </motion.section>

        <section className="home__section">
          <h2 className="home__section-title">Quick add</h2>
          {added && <p className="home__success">Card tucked into a stack.</p>}
          <QuickAddCard stacks={stacks} onSubmit={handleQuickAdd} />
        </section>

        <section className="home__links">
          <Link to="/stacks" className="home__link-card">
            <span className="home__link-title">Manage stacks</span>
            <span className="home__link-desc">{stacks.length} stack{stacks.length !== 1 ? 's' : ''}</span>
          </Link>
          <Link to="/cards" className="home__link-card">
            <span className="home__link-title">Manage cards</span>
            <span className="home__link-desc">Browse and edit all cards</span>
          </Link>
        </section>
      </div>
    </Layout>
  );
}
