export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  dailyScreenGoalMinutes: number;
  breakStyle: 'gentle' | 'visual' | 'stretch';
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  freezeCount: number;
  freezeUsedToday: boolean;
  isGoalMetToday: boolean;
}

export interface DailyStats {
  date: string;
  userId: string;
  activeScreenSeconds: number;
  breaksCompleted: number;
  breaksTarget: number;
  exercisesCompleted: number;
  exercisesTarget: number;
  pointsEarned: number;
  consistencyScore: number;
  challengesCompleted: string[];
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

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  isCurrentUser: boolean;
  isFriend: boolean;
  points: number;
  streak: number;
  consistencyScore: number;
  breaksTaken: number;
  activeMinutes: number;
  kudosReceived: number;
  rank: number;
}

export interface UserSettings {
  breakIntervalMinutes: number;
  breakDurationSeconds: number;
  blueLightFilterEnabled: boolean;
  blueLightAutoMode: boolean;
  blueLightIntensity: number;
  blueLightWarmth: 'amber' | 'candle' | 'twilight';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyScreenGoalMinutes: number;
  backgroundModeEnabled: boolean;
  backgroundAudioAlert: boolean;
}

export type TabType = 'dashboard' | 'analytics' | 'leaderboard' | 'exercises' | 'settings';

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
  hour: string; // e.g., "9 AM"
  screenMinutes: number;
  strainScore: number; // 1 - 10
  breaksTaken: number;
}

export interface WeeklyScreenData {
  day: string; // "Mon", "Tue", etc.
  date: string;
  screenHours: number;
  strainScore: number; // 1 - 10
  breaksTaken: number;
  targetHours: number;
}

export interface CorrelationStats {
  pearsonR: number; // e.g., +0.84
  correlationLabel: 'Strong Positive' | 'Moderate Positive' | 'Weak' | 'Balanced';
  criticalThresholdHours: number; // e.g. 4.5h
  strainReductionPercent: number; // e.g. 42%
  currentTodayStrain: number; // 1 - 10
  peakStrainTime: string; // e.g. "3:00 PM - 5:00 PM"
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
