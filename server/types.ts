export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  dailyScreenGoalMinutes: number; // e.g. 360 (6 hours)
  breakStyle: 'gentle' | 'visual' | 'stretch';
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  freezeCount: number;
  freezeUsedToday: boolean;
  isGoalMetToday: boolean;
}

export interface BreakRecord {
  id: string;
  userId: string;
  timestamp: string;
  durationSeconds: number;
  status: 'completed' | 'skipped' | 'dismissed';
  pointsEarned: number;
  type: '20-20-20' | 'custom';
}

export interface ExerciseRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseTitle: string;
  timestamp: string;
  durationSeconds: number;
  pointsEarned: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  type: 'figure-eight' | 'near-far' | 'blinking' | 'palming' | 'four-corner';
  points: number;
  completed: boolean;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  userId: string;
  activeScreenSeconds: number;
  breaksCompleted: number;
  breaksTarget: number;
  exercisesCompleted: number;
  exercisesTarget: number;
  pointsEarned: number;
  consistencyScore: number; // 0 to 100%
  challengesCompleted: string[]; // exercise ids
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  isCurrentUser: boolean;
  isFriend: boolean;
  points: number;
  streak: number;
  consistencyScore: number; // Eye Health consistency index
  breaksTaken: number;
  activeMinutes: number;
  kudosReceived: number;
  rank: number;
}

export interface UserSettings {
  breakIntervalMinutes: number; // default 20
  breakDurationSeconds: number; // default 20
  blueLightFilterEnabled: boolean;
  blueLightAutoMode: boolean; // auto based on ambient light / time of day
  blueLightIntensity: number; // 10 to 90 %
  blueLightWarmth: 'amber' | 'candle' | 'twilight';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyScreenGoalMinutes: number;
  backgroundModeEnabled: boolean;
  backgroundAudioAlert: boolean;
}

export interface EyeStrainLog {
  id: string;
  timestamp: string;
  score: number; // 1 - 10
  symptoms: string[];
  screenMinutesSoFar: number;
  breaksTakenSoFar: number;
  notes?: string;
}

export interface HourlyScreenData {
  hour: string;
  screenMinutes: number;
  strainScore: number;
  breaksTaken: number;
}

export interface WeeklyScreenData {
  day: string;
  date: string;
  screenHours: number;
  strainScore: number;
  breaksTaken: number;
  targetHours: number;
}

export interface CorrelationStats {
  pearsonR: number;
  correlationLabel: 'Strong Positive' | 'Moderate Positive' | 'Weak' | 'Balanced';
  criticalThresholdHours: number;
  strainReductionPercent: number;
  currentTodayStrain: number;
  peakStrainTime: string;
  totalBreakProtectionCount: number;
}

export interface EyeHealthRecommendation {
  id: string;
  title: string;
  category: 'frequency' | 'blue_light' | 'exercise' | 'ergonomics';
  priority: 'high' | 'medium' | 'tip';
  insight: string;
  actionText: string;
  actionType: 'set_interval_15' | 'toggle_blue_light' | 'start_challenge' | 'trigger_break' | 'info';
  actionPayload?: string;
}

export interface CorrelationDataResponse {
  dailyHourly: HourlyScreenData[];
  weekly: WeeklyScreenData[];
  correlationStats: CorrelationStats;
  recommendations: EyeHealthRecommendation[];
  recentLogs: EyeStrainLog[];
  todayScreenMinutes: number;
  todayBreaksCompleted: number;
}
