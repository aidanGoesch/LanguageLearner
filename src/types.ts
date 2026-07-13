export type CardState = 'New' | 'Learning' | 'Review' | 'Relearning';

export interface Stack {
  id: string;
  name: string;
  language: string;
  createdAt: number;
}

export interface Card {
  id: string;
  stackId: string;
  term: string;
  definition: string;
  createdAt: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: CardState;
  last_review: number | null;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  reviewedAt: number;
  previousState: string;
}

export interface AppSettings {
  newCardsPerDay: number;
  requestRetention: number;
}

export type Grade = 'forgot' | 'struggled' | 'easy';

export type StudyScope =
  | { type: 'all' }
  | { type: 'language'; language: string }
  | { type: 'stack'; stackId: string }
  | { type: 'custom'; stackIds: string[] };

export type CreatureStage = 'egg' | 'baby' | 'juvenile' | 'adult' | 'elder';

export type CreatureStatus = 'happy' | 'hungry' | 'sick' | 'critical' | 'gone';

export interface Creature {
  id: string;
  name: string;
  species: string;
  adoptedAt: number;
  stage: CreatureStage;
  xpTowardNextStage: number;
  totalXp: number;
  hunger: number;
  happiness: number;
  status: CreatureStatus;
  lastFedAt: number;
  cosmetics: {
    skin: string;
    accessories: string[];
  };
}

export interface Profile {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  freezesAvailable: number;
  lastFreezeAccrualDate: string;
  coins: number;
  ownedCosmetics: string[];
  totalReviews: number;
  usageHours: number[];
  notificationsEnabled: boolean;
  notificationHour: number;
  adaptiveNotificationTime: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type CosmeticType = 'skin' | 'accessory' | 'habitat' | 'cardback' | 'feedAnim';

export interface Cosmetic {
  id: string;
  name: string;
  type: CosmeticType;
  price: number;
  description: string;
}

export interface BackupData {
  version: number;
  exportedAt: number;
  stacks: Stack[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  settings: AppSettings;
  creature: Creature;
  profile: Profile;
}

export type ImportMode = 'merge' | 'overwrite';

export interface SessionStats {
  total: number;
  forgot: number;
  struggled: number;
  easy: number;
}

export interface SessionGameStats {
  xpEarned: number;
  coinsEarned: number;
  comboPeak: number;
  variableRewards: Array<{ label: string; kind: 'coins' | 'cosmetic' }>;
  dayCompleted: boolean;
  streakAfter?: number;
  streakMilestone?: number | null;
  evolved?: boolean;
  evolutionStage?: CreatureStage;
  fed?: boolean;
}
