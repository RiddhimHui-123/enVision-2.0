import { DailyStats, StreakData } from './types.ts';

export const POINTS_CONFIG = {
  BREAK_COMPLETED: 50,
  BREAK_SKIPPED: 0,
  EXERCISE_COMPLETED: 40,
  ALL_DAILY_CHALLENGES_BONUS: 100,
  STREAK_DAY_BONUS: 20,
};

export const DAILY_TARGETS = {
  MIN_BREAKS_FOR_STREAK: 3,
  MIN_EXERCISES_FOR_STREAK: 1,
};

export function getTodayDateString(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates consistency score (0 - 100)
 * Evaluates healthy eye habits based on break frequency relative to screen time
 * Avoids penalizing users simply for having high screen time if breaks are taken reliably!
 */
export function calculateConsistencyScore(
  activeScreenMinutes: number,
  breaksCompleted: number
): number {
  if (activeScreenMinutes < 15) {
    return breaksCompleted > 0 ? 100 : 85;
  }

  // Expect approximately 1 break every 20-25 minutes
  const expectedBreaks = Math.max(1, Math.floor(activeScreenMinutes / 25));
  const ratio = breaksCompleted / expectedBreaks;
  
  const score = Math.min(100, Math.round(ratio * 90 + (breaksCompleted >= 3 ? 10 : 0)));
  return Math.max(10, score);
}

/**
 * Updates streak status for a user based on today's progress and yesterday's activity
 */
export function evaluateStreak(
  currentStreakData: StreakData,
  todayStats: DailyStats
): { updatedStreak: StreakData; streakIncreased: boolean; freezeUsed: boolean } {
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const isGoalMetNow =
    todayStats.breaksCompleted >= DAILY_TARGETS.MIN_BREAKS_FOR_STREAK &&
    todayStats.exercisesCompleted >= DAILY_TARGETS.MIN_EXERCISES_FOR_STREAK;

  const result: StreakData = { ...currentStreakData };
  let streakIncreased = false;
  let freezeUsed = false;

  // Check if we need to check continuity from yesterday
  if (result.lastActiveDate !== todayStr && result.lastActiveDate !== yesterdayStr) {
    // There was a gap! Check if streak freeze can protect it
    if (result.currentStreak > 0) {
      if (result.freezeCount > 0 && !result.freezeUsedToday) {
        result.freezeCount -= 1;
        result.freezeUsedToday = true;
        freezeUsed = true;
      } else {
        // Streak lost
        result.currentStreak = 0;
      }
    }
  }

  // If goal met today and not already counted for today
  if (isGoalMetNow && !result.isGoalMetToday) {
    result.currentStreak += 1;
    if (result.currentStreak > result.longestStreak) {
      result.longestStreak = result.currentStreak;
    }
    result.isGoalMetToday = true;
    result.lastActiveDate = todayStr;
    streakIncreased = true;
  }

  return { updatedStreak: result, streakIncreased, freezeUsed };
}
