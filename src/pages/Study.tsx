import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { ReviewSession } from '../components/ReviewSession';
import { SessionSummary } from '../components/SessionSummary';
import { StudyScopePicker } from '../components/StudyScopePicker';
import {
  addReviewLog,
  getAllCards,
  getAllReviewLogs,
  getAllStacks,
  getCreature,
  getProfile,
  getSettings,
  updateCard,
  updateCreature,
  updateProfile,
} from '../db';
import {
  buildQueue,
  countNewCardsStudiedToday,
  countReadyToStudy,
  filterCardsByScope,
  forecastDue,
} from '../fsrs/queue';
import { gradeCard } from '../fsrs/grade';
import {
  addCreatureXp,
  applyHungerDecay,
  applyVariableReward,
  checkEvolution,
  coinsFromXp,
  completeStudyDay,
  detectStreakMilestone,
  feedCreature,
  reconcileStreak,
  rollVariableReward,
  shouldResetCombo,
  trackUsageHour,
  xpForReview,
} from '../game';
import { sfx } from '../audio/sfx';
import type { Card, Creature, Grade, SessionGameStats, SessionStats, StudyScope } from '../types';

const EMPTY_GAME: SessionGameStats = {
  xpEarned: 0,
  coinsEarned: 0,
  comboPeak: 0,
  variableRewards: [],
  dayCompleted: false,
};

export function Study() {
  const [phase, setPhase] = useState<'pick' | 'review' | 'done'>('pick');
  const [queue, setQueue] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [stacks, setStacks] = useState<Awaited<ReturnType<typeof getAllStacks>>>([]);
  const [creature, setCreature] = useState<Creature | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    forgot: 0,
    struggled: 0,
    easy: 0,
  });
  const [gameStats, setGameStats] = useState<SessionGameStats>(EMPTY_GAME);
  const comboRef = useRef(0);
  const [combo, setCombo] = useState(0);
  const sessionGameRef = useRef({ ...EMPTY_GAME });

  const loadData = useCallback(async () => {
    const [cards, stackList, logs, settings, prof, crit] = await Promise.all([
      getAllCards(),
      getAllStacks(),
      getAllReviewLogs(),
      getSettings(),
      getProfile(),
      getCreature(),
    ]);
    setAllCards(cards);
    setStacks(stackList);
    const reconciled = reconcileStreak(prof);
    if (reconciled !== prof) await updateProfile(reconciled);
    const decayed = applyHungerDecay(crit);
    if (decayed !== crit) await updateCreature(decayed);
    setCreature(decayed);
    setSoundEnabled(reconciled.soundEnabled);
    setHapticsEnabled(reconciled.hapticsEnabled);
    sfx.setMuted(!reconciled.soundEnabled);
    return { cards, stackList, logs, settings };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStart = async (scope: StudyScope) => {
    const { cards, stackList, logs, settings } = await loadData();
    const scoped = filterCardsByScope(cards, stackList, scope);
    const newToday = countNewCardsStudiedToday(logs);
    const built = buildQueue(scoped, settings, newToday);
    if (built.length === 0) {
      alert('No cards due for this selection. Check back later!');
      return;
    }
    comboRef.current = 0;
    setCombo(0);
    sessionGameRef.current = { ...EMPTY_GAME };
    setGameStats({ ...EMPTY_GAME });
    setQueue(built);
    setSessionStats({ total: 0, forgot: 0, struggled: 0, easy: 0 });
    setPhase('review');
  };

  const handleGrade = async (card: Card, grade: Grade): Promise<Card> => {
    const settings = await getSettings();
    const { card: updated, log } = gradeCard(card, grade, settings);
    await updateCard(updated);
    await addReviewLog(log);

    let prof = (await getProfile())!;
    let crit = (await getCreature())!;

    if (shouldResetCombo(grade)) {
      comboRef.current = 0;
    } else {
      comboRef.current += 1;
    }
    setCombo(comboRef.current);

    const xp = xpForReview(card, grade, comboRef.current);
    const coins = coinsFromXp(xp);
    prof = {
      ...trackUsageHour(prof),
      coins: prof.coins + coins,
      totalReviews: prof.totalReviews + 1,
    };
    crit = addCreatureXp(crit, xp);

    const reward = rollVariableReward(prof.ownedCosmetics);
    const sg = sessionGameRef.current;
    sg.xpEarned += xp;
    sg.coinsEarned += coins;
    sg.comboPeak = Math.max(sg.comboPeak, comboRef.current);
    if (reward) {
      const applied = applyVariableReward(reward, prof.coins, prof.ownedCosmetics);
      prof = { ...prof, coins: applied.coins, ownedCosmetics: applied.ownedCosmetics };
      if (reward.kind === 'coins') sg.coinsEarned += reward.amount;
      sg.variableRewards.push({ label: reward.label, kind: reward.kind });
    }

    await updateProfile(prof);
    await updateCreature(crit);
    setCreature(crit);

    if (reward && prof.soundEnabled) sfx.play('reward');

    setSessionStats((s) => ({
      total: s.total + 1,
      forgot: s.forgot + (grade === 'forgot' ? 1 : 0),
      struggled: s.struggled + (grade === 'struggled' ? 1 : 0),
      easy: s.easy + (grade === 'easy' ? 1 : 0),
    }));
    setAllCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setGameStats({ ...sg });
    return updated;
  };

  const handleComplete = useCallback(async () => {
    const [cards, logs, settings, prof, crit] = await Promise.all([
      getAllCards(),
      getAllReviewLogs(),
      getSettings(),
      getProfile(),
      getCreature(),
    ]);
    setAllCards(cards);

    const newToday = countNewCardsStudiedToday(logs);
    const remaining = countReadyToStudy(cards, settings, newToday);
    const sg = { ...sessionGameRef.current };
    let updatedProfile = prof;
    let updatedCreature = crit;

    if (remaining === 0) {
      updatedCreature = feedCreature(updatedCreature);
      updatedProfile = completeStudyDay(updatedProfile);
      const evo = checkEvolution(updatedCreature, updatedProfile);
      updatedCreature = evo.creature;
      sg.dayCompleted = true;
      sg.fed = true;
      sg.streakAfter = updatedProfile.currentStreak;
      sg.streakMilestone = detectStreakMilestone(updatedProfile.currentStreak);
      if (evo.evolved) {
        sg.evolved = true;
        sg.evolutionStage = evo.toStage;
        if (updatedProfile.soundEnabled) sfx.play('levelUp');
      } else if (updatedProfile.soundEnabled) {
        sfx.play('feed');
      }
      await updateProfile(updatedProfile);
      await updateCreature(updatedCreature);
      setCreature(updatedCreature);
    }

    sessionGameRef.current = sg;
    setGameStats(sg);
    setPhase('done');
  }, []);

  if (phase === 'review' && queue.length > 0) {
    return (
      <Layout hideNav>
        <ReviewSession
          cards={queue}
          combo={combo}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          creatureStage={creature?.stage ?? 'egg'}
          creatureStatus={creature?.status ?? 'happy'}
          creatureSkin={creature?.cosmetics.skin}
          creatureAccessories={creature?.cosmetics.accessories}
          onGrade={handleGrade}
          onComplete={handleComplete}
        />
      </Layout>
    );
  }

  if (phase === 'done') {
    return (
      <Layout title="Session">
        <SessionSummary
          stats={sessionStats}
          gameStats={gameStats}
          forecast={forecastDue(allCards)}
          creatureStage={creature?.stage}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Study">
      <StudyScopePicker stacks={stacks} onStart={handleStart} />
    </Layout>
  );
}
