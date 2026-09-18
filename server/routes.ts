import { Router, Request, Response } from 'express';
import { db, DEFAULT_USER_ID } from './db.ts';
import {
  POINTS_CONFIG,
  calculateConsistencyScore,
  evaluateStreak,
  getTodayDateString,
} from './pointsEngine.ts';
import { BreakRecord, ExerciseRecord } from './types.ts';

export const router = Router();

// Middleware to get current user ID
function getActiveUserId(req: Request): string {
  const headerId = req.headers['x-user-id'];
  if (typeof headerId === 'string' && db.getUser(headerId)) {
    return headerId;
  }
  return DEFAULT_USER_ID;
}

// 1. Get current user & app state
router.get('/auth/me', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const streak = db.getStreak(userId);
  const todayStats = db.getOrCreateTodayStats(userId);
  const settings = db.getSettings(userId);
  const challenges = db.getDailyChallenges(userId);
  const allChallengesCompleted = challenges.every((c) => c.completed);

  res.json({
    user,
    streak,
    todayStats,
    settings,
    challenges,
    allChallengesCompleted,
  });
});

// 2. Log a 20-20-20 Break
router.post('/breaks', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const { status, durationSeconds = 20, type = '20-20-20' } = req.body;

  const todayStats = db.getOrCreateTodayStats(userId);
  const streak = db.getStreak(userId);

  let pointsAwarded = 0;
  if (status === 'completed') {
    pointsAwarded = POINTS_CONFIG.BREAK_COMPLETED;
    todayStats.breaksCompleted += 1;
    todayStats.pointsEarned += pointsAwarded;

    // Recalculate consistency score
    const activeMinutes = Math.max(1, Math.round(todayStats.activeScreenSeconds / 60));
    todayStats.consistencyScore = calculateConsistencyScore(activeMinutes, todayStats.breaksCompleted);

    // Evaluate streak
    const streakResult = evaluateStreak(streak, todayStats);
    db.streaks.set(userId, streakResult.updatedStreak);
  }

  const record: BreakRecord = {
    id: `brk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    timestamp: new Date().toISOString(),
    durationSeconds: Number(durationSeconds),
    status: status === 'completed' ? 'completed' : 'skipped',
    pointsEarned: pointsAwarded,
    type,
  };

  db.breaks.push(record);

  res.json({
    success: true,
    record,
    pointsAwarded,
    todayStats,
    streak: db.getStreak(userId),
  });
});

// 3. Log completed exercise challenge
router.post('/exercises', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const { exerciseId, exerciseTitle, durationSeconds = 30 } = req.body;

  const todayStats = db.getOrCreateTodayStats(userId);
  const streak = db.getStreak(userId);

  let pointsEarned = POINTS_CONFIG.EXERCISE_COMPLETED;

  if (!todayStats.challengesCompleted.includes(exerciseId)) {
    todayStats.challengesCompleted.push(exerciseId);
    todayStats.exercisesCompleted += 1;
  }

  // Check if this completes all daily challenges for bonus!
  const challenges = db.getDailyChallenges(userId);
  const allNowCompleted = challenges.every((c) => todayStats.challengesCompleted.includes(c.id));
  let bonusEarned = 0;

  if (allNowCompleted && !todayStats.challengesCompleted.includes('__all_bonus_awarded__')) {
    bonusEarned = POINTS_CONFIG.ALL_DAILY_CHALLENGES_BONUS;
    pointsEarned += bonusEarned;
    todayStats.challengesCompleted.push('__all_bonus_awarded__');
  }

  todayStats.pointsEarned += pointsEarned;

  // Evaluate streak update
  const streakResult = evaluateStreak(streak, todayStats);
  db.streaks.set(userId, streakResult.updatedStreak);

  const record: ExerciseRecord = {
    id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    exerciseId,
    exerciseTitle: exerciseTitle || 'Eye Exercise',
    timestamp: new Date().toISOString(),
    durationSeconds: Number(durationSeconds),
    pointsEarned,
  };

  db.exercises.push(record);

  res.json({
    success: true,
    record,
    pointsEarned,
    bonusEarned,
    allCompleted: allNowCompleted,
    todayStats,
    streak: db.getStreak(userId),
    challenges: db.getDailyChallenges(userId),
  });
});

// 4. Leaderboard (Friends and Global)
router.get('/leaderboard', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const filter = (req.query.filter as 'friends' | 'global') || 'friends';
  const leaderboard = db.getLeaderboard(userId, filter);

  res.json({
    filter,
    leaderboard,
  });
});

// 5. Send Kudos (Strava-style appreciation)
router.post('/kudos', (req: Request, res: Response) => {
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }

  const currentKudos = db.kudos.get(targetUserId) || 0;
  db.kudos.set(targetUserId, currentKudos + 1);

  res.json({
    success: true,
    targetUserId,
    newKudosCount: currentKudos + 1,
  });
});

// 6. Privacy-conscious screen time & activity heartbeat sync
router.post('/stats/activity', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const { activeSecondsToAdd = 0 } = req.body;

  const todayStats = db.getOrCreateTodayStats(userId);
  todayStats.activeScreenSeconds += Math.max(0, Math.min(600, Number(activeSecondsToAdd)));

  const activeMinutes = Math.max(1, Math.round(todayStats.activeScreenSeconds / 60));
  todayStats.consistencyScore = calculateConsistencyScore(activeMinutes, todayStats.breaksCompleted);

  res.json({
    success: true,
    activeScreenSeconds: todayStats.activeScreenSeconds,
    consistencyScore: todayStats.consistencyScore,
  });
});

// 7. Update User Settings
router.put('/settings', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const current = db.getSettings(userId);
  const updated = {
    ...current,
    ...req.body,
  };
  db.settings.set(userId, updated);

  res.json({
    success: true,
    settings: updated,
  });
});

// 8. Use or equip Streak Freeze
router.post('/streak/freeze', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const streak = db.getStreak(userId);

  if (req.body.action === 'purchase') {
    streak.freezeCount += 1;
  } else if (req.body.action === 'use') {
    if (streak.freezeCount > 0 && !streak.freezeUsedToday) {
      streak.freezeCount -= 1;
      streak.freezeUsedToday = true;
    }
  }

  res.json({
    success: true,
    streak,
  });
});

// 9. Get Screen Time to Eye Strain Correlation & Recommendations
router.get('/analytics/correlation', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const data = db.getCorrelationData(userId);
  res.json(data);
});

// 10. Log subjective eye strain check-in
router.post('/analytics/log-strain', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  const { score, symptoms = [], notes = '' } = req.body;

  if (typeof score !== 'number' || score < 1 || score > 10) {
    return res.status(400).json({ error: 'Valid score between 1 and 10 is required' });
  }

  const log = db.logEyeStrain(userId, score, symptoms, notes);
  const updatedCorrelation = db.getCorrelationData(userId);

  res.json({
    success: true,
    log,
    correlation: updatedCorrelation,
  });
});
