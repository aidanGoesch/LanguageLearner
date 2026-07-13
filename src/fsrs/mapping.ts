import { Rating, State, type Card as FsrsCard, type Grade as FsrsGrade } from 'ts-fsrs';
import type { Card, CardState, Grade } from '../types';

const STATE_TO_STRING: Record<State, CardState> = {
  [State.New]: 'New',
  [State.Learning]: 'Learning',
  [State.Review]: 'Review',
  [State.Relearning]: 'Relearning',
};

const STRING_TO_STATE: Record<CardState, State> = {
  New: State.New,
  Learning: State.Learning,
  Review: State.Review,
  Relearning: State.Relearning,
};

export function mapGradeToFsrsRating(grade: Grade): FsrsGrade {
  switch (grade) {
    case 'forgot':
      return Rating.Again;
    case 'struggled':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
  }
}

export function mapFsrsRatingToGrade(rating: number): Grade {
  if (rating === Rating.Again) return 'forgot';
  if (rating === Rating.Easy) return 'easy';
  if (rating === Rating.Good) return 'struggled';
  return 'struggled';
}

export function toFsrsCard(stored: Card): FsrsCard {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    learning_steps: stored.learning_steps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: STRING_TO_STATE[stored.state],
    last_review: stored.last_review != null ? new Date(stored.last_review) : undefined,
  };
}

export function fromFsrsCard(fsrsCard: FsrsCard): Pick<
  Card,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsed_days'
  | 'scheduled_days'
  | 'learning_steps'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'last_review'
> {
  return {
    due: fsrsCard.due.getTime(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    elapsed_days: fsrsCard.elapsed_days,
    scheduled_days: fsrsCard.scheduled_days,
    learning_steps: fsrsCard.learning_steps,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: STATE_TO_STRING[fsrsCard.state],
    last_review: fsrsCard.last_review ? fsrsCard.last_review.getTime() : null,
  };
}
