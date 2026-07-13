import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CreatureStage, SessionGameStats, SessionStats } from '../types';
import { stageLabel } from '../game/creature';
import { riseIn, springSoft, staggerContainer } from '../ui/motion';
import './SessionSummary.css';

interface SessionSummaryProps {
  stats: SessionStats;
  gameStats: SessionGameStats;
  forecast: { dueSoon: number; dueLaterToday: number; tomorrow: number; thisWeek: number };
  creatureStage?: CreatureStage;
}

export function SessionSummary({ stats, gameStats, forecast, creatureStage }: SessionSummaryProps) {
  const highlights: string[] = [];
  if (gameStats.comboPeak >= 3) highlights.push(`Peak combo ×${gameStats.comboPeak}`);
  if (gameStats.coinsEarned > 0) highlights.push(`+${gameStats.coinsEarned} coins pocketed`);
  if (gameStats.variableRewards.length > 0) {
    highlights.push(...gameStats.variableRewards.map((r) => r.label));
  }
  if (gameStats.evolved && gameStats.evolutionStage) {
    highlights.push(`Evolved into ${stageLabel(gameStats.evolutionStage)}!`);
  }
  if (gameStats.streakMilestone) {
    highlights.push(`${gameStats.streakMilestone}-day streak milestone`);
  }

  return (
    <motion.div
      className="session-summary"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 className="session-summary__title" variants={riseIn}>
        {gameStats.dayCompleted ? 'Den fed for today' : 'Session wrapped'}
      </motion.h2>

      {gameStats.dayCompleted && (
        <motion.p className="session-summary__lead" variants={riseIn}>
          {gameStats.fed ? 'Your companion ate well. Streak intact.' : 'Queue cleared — nice work.'}
          {gameStats.streakAfter != null && (
            <span className="session-summary__streak"> 🔥 {gameStats.streakAfter} day streak</span>
          )}
        </motion.p>
      )}

      <motion.div className="session-summary__reel" variants={riseIn}>
        <p className="session-summary__total">{stats.total} cards · highlight reel</p>
        <div className="session-summary__breakdown">
          <div className="session-summary__stat session-summary__stat--forgot">
            <span className="session-summary__count">{stats.forgot}</span>
            <span className="session-summary__label">Forgot</span>
          </div>
          <div className="session-summary__stat session-summary__stat--struggled">
            <span className="session-summary__count">{stats.struggled}</span>
            <span className="session-summary__label">Struggled</span>
          </div>
          <div className="session-summary__stat session-summary__stat--easy">
            <span className="session-summary__count">{stats.easy}</span>
            <span className="session-summary__label">Easy</span>
          </div>
        </div>

        {(gameStats.xpEarned > 0 || highlights.length > 0) && (
          <ul className="session-summary__highlights">
            {gameStats.xpEarned > 0 && <li>+{gameStats.xpEarned} XP for {creatureStage ? stageLabel(creatureStage) : 'companion'}</li>}
            {highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
      </motion.div>

      <motion.div className="session-summary__forecast" variants={riseIn} transition={springSoft}>
        {forecast.dueSoon > 0 && (
          <p>
            <strong>{forecast.dueSoon}</strong> card{forecast.dueSoon !== 1 ? 's' : ''} due again within the hour
          </p>
        )}
        {forecast.dueLaterToday > 0 && (
          <p>
            <strong>{forecast.dueLaterToday}</strong> more due later today
          </p>
        )}
        {forecast.dueSoon === 0 && forecast.dueLaterToday === 0 && (
          <p className="session-summary__forecast-note">Nothing else scheduled for today.</p>
        )}
        <p>
          <strong>{forecast.tomorrow}</strong> card{forecast.tomorrow !== 1 ? 's' : ''} due tomorrow
        </p>
        <p>
          <strong>{forecast.thisWeek}</strong> more due this week
        </p>
      </motion.div>

      <motion.div className="session-summary__actions" variants={riseIn}>
        <Link to="/" className="btn btn--primary btn--block btn--lg">
          Back to den
        </Link>
        <Link to="/study" className="btn btn--ghost btn--block">
          Study again
        </Link>
      </motion.div>
    </motion.div>
  );
}
