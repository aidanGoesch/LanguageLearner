import type { Grade } from '../types';
import './GradeButtons.css';

interface GradeButtonsProps {
  onGrade: (grade: Grade) => void;
  disabled?: boolean;
}

export function GradeButtons({ onGrade, disabled }: GradeButtonsProps) {
  return (
    <div className="grade-buttons">
      <button
        type="button"
        className="grade-buttons__btn grade-buttons__btn--forgot"
        onClick={() => onGrade('forgot')}
        disabled={disabled}
      >
        Forgot
      </button>
      <button
        type="button"
        className="grade-buttons__btn grade-buttons__btn--struggled"
        onClick={() => onGrade('struggled')}
        disabled={disabled}
      >
        Struggled
      </button>
      <button
        type="button"
        className="grade-buttons__btn grade-buttons__btn--easy"
        onClick={() => onGrade('easy')}
        disabled={disabled}
      >
        Easy
      </button>
    </div>
  );
}
