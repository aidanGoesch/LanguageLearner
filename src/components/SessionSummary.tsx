import { Link } from 'react-router-dom';
import type { SessionStats } from '../types';

interface SessionSummaryProps {
  stats: SessionStats;
  forecast: { tomorrow: number; thisWeek: number };
}

export function SessionSummary({ stats, forecast }: SessionSummaryProps) {
  return (
    <div className="session-summary">
      <h2 className="session-summary__title">Session complete</h2>
      <p className="session-summary__total">{stats.total} cards reviewed</p>

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

      <div className="session-summary__forecast">
        <p>
          <strong>{forecast.tomorrow}</strong> card{forecast.tomorrow !== 1 ? 's' : ''} due tomorrow
        </p>
        <p>
          <strong>{forecast.thisWeek}</strong> more due this week
        </p>
      </div>

      <Link to="/" className="btn btn--primary btn--block btn--lg">
        Back to home
      </Link>
      <Link to="/study" className="btn btn--ghost btn--block">
        Study again
      </Link>
    </div>
  );
}
