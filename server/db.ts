import {
  User,
  DailyStats,
  StreakData,
  BreakRecord,
  ExerciseRecord,
  DailyChallenge,
  LeaderboardEntry,
  UserSettings,
  EyeStrainLog,
  HourlyScreenData,
  WeeklyScreenData,
  CorrelationStats,
  EyeHealthRecommendation,
  CorrelationDataResponse,
} from './types.ts';
import { getTodayDateString, calculateConsistencyScore } from './pointsEngine.ts';

// Initial default user
export const DEFAULT_USER_ID = 'usr_me';

const DEFAULT_CHALLENGES: Omit<DailyChallenge, 'completed'>[] = [
  {
    id: 'ch_fig8',
    title: 'Figure-Eight Smooth Tracking',
    description: 'Track an animated visual infinity loop smoothly to exercise extraocular muscles and relieve stiffness.',
    durationSeconds: 30,
    type: 'figure-eight',
    points: 40,
  },
  {
    id: 'ch_nearfar',
    title: 'Near-to-Far Accommodation Shift',
    description: 'Alternate focus between a close target (your thumb) and a distant horizon to flex ciliary muscles.',
    durationSeconds: 45,
    type: 'near-far',
    points: 40,
  },
  {
    id: 'ch_blink',
    title: 'Hydrating Micro-Blink Rhythm',
    description: 'Perform conscious, complete eyelid closures to stimulate meibomian glands and restore natural tear film.',
    durationSeconds: 30,
    type: 'blinking',
    points: 40,
  },
  {
    id: 'ch_palm',
    title: 'Deep Warmth Palming',
    description: 'Warm hands by gentle rubbing, then cup over closed eyes to soothe photoreceptors in total darkness.',
    durationSeconds: 60,
    type: 'palming',
    points: 50,
  },
];

class Database {
  users: Map<string, User> = new Map();
  streaks: Map<string, StreakData> = new Map();
  dailyStats: Map<string, DailyStats> = new Map(); // key: userId_YYYY-MM-DD
  breaks: BreakRecord[] = [];
  exercises: ExerciseRecord[] = [];
  settings: Map<string, UserSettings> = new Map();
  kudos: Map<string, number> = new Map(); // userId -> kudos count
  eyeStrainLogs: EyeStrainLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    const today = getTodayDateString();

    // Current user
    const mainUser: User = {
      id: DEFAULT_USER_ID,
      name: 'Alex Rivera',
      email: 'alex@eyes.health',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dailyScreenGoalMinutes: 360,
      breakStyle: 'gentle',
      notificationsEnabled: true,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    };
    this.users.set(mainUser.id, mainUser);

    this.streaks.set(mainUser.id, {
      currentStreak: 5,
      longestStreak: 12,
      lastActiveDate: today,
      freezeCount: 2,
      freezeUsedToday: false,
      isGoalMetToday: false,
    });

    this.settings.set(mainUser.id, {
      breakIntervalMinutes: 20,
      breakDurationSeconds: 20,
      blueLightFilterEnabled: true,
      blueLightAutoMode: true,
      blueLightIntensity: 45,
      blueLightWarmth: 'amber',
      soundEnabled: true,
      notificationsEnabled: true,
      dailyScreenGoalMinutes: 360,
      backgroundModeEnabled: true,
      backgroundAudioAlert: true,
    });

    // Seed today's stats for current user
    const todayStatsKey = `${mainUser.id}_${today}`;
    this.dailyStats.set(todayStatsKey, {
      date: today,
      userId: mainUser.id,
      activeScreenSeconds: 4200, // 70 min
      breaksCompleted: 2,
      breaksTarget: 4,
      exercisesCompleted: 1,
      exercisesTarget: 3,
      pointsEarned: 140,
      consistencyScore: 88,
      challengesCompleted: ['ch_fig8'],
    });

    // Seed mock friends & global competitors for Strava/Duolingo style community
    const samplePeers = [
      {
        id: 'usr_sarah',
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        points: 490,
        streak: 9,
        consistency: 96,
        breaks: 8,
        activeMins: 210,
        isFriend: true,
        kudos: 14,
      },
      {
        id: 'usr_marcus',
        name: 'Marcus Vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        points: 420,
        streak: 6,
        consistency: 91,
        breaks: 7,
        activeMins: 245,
        isFriend: true,
        kudos: 8,
      },
      {
        id: 'usr_elena',
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        points: 380,
        streak: 4,
        consistency: 89,
        breaks: 6,
        activeMins: 190,
        isFriend: true,
        kudos: 5,
      },
      {
        id: 'usr_daiki',
        name: 'Daiki Tanaka',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        points: 560,
        streak: 18,
        consistency: 98,
        breaks: 11,
        activeMins: 320,
        isFriend: false,
        kudos: 32,
      },
      {
        id: 'usr_priya',
        name: 'Priya Patel',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        points: 510,
        streak: 14,
        consistency: 94,
        breaks: 9,
        activeMins: 280,
        isFriend: false,
        kudos: 21,
      },
      {
        id: 'usr_liam',
        name: 'Liam O’Connor',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        points: 310,
        streak: 3,
        consistency: 84,
        breaks: 5,
        activeMins: 260,
        isFriend: false,
        kudos: 4,
      },
    ];

    samplePeers.forEach((peer) => {
      const u: User = {
        id: peer.id,
        name: peer.name,
        email: `${peer.id}@example.com`,
        avatar: peer.avatar,
        dailyScreenGoalMinutes: 360,
        breakStyle: 'visual',
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
      };
      this.users.set(u.id, u);
      this.streaks.set(u.id, {
        currentStreak: peer.streak,
        longestStreak: peer.streak + 4,
        lastActiveDate: today,
        freezeCount: 1,
        freezeUsedToday: false,
        isGoalMetToday: true,
      });
      this.kudos.set(u.id, peer.kudos);

      const statsKey = `${u.id}_${today}`;
      this.dailyStats.set(statsKey, {
        date: today,
        userId: u.id,
        activeScreenSeconds: peer.activeMins * 60,
        breaksCompleted: peer.breaks,
        breaksTarget: 4,
        exercisesCompleted: 2,
        exercisesTarget: 3,
        pointsEarned: peer.points,
        consistencyScore: peer.consistency,
        challengesCompleted: ['ch_fig8', 'ch_nearfar'],
      });
    });

    this.kudos.set(mainUser.id, 12);
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getOrCreateTodayStats(userId: string): DailyStats {
    const today = getTodayDateString();
    const key = `${userId}_${today}`;
    let stats = this.dailyStats.get(key);
    if (!stats) {
      stats = {
        date: today,
        userId,
        activeScreenSeconds: 0,
        breaksCompleted: 0,
        breaksTarget: 4,
        exercisesCompleted: 0,
        exercisesTarget: 3,
        pointsEarned: 0,
        consistencyScore: 100,
        challengesCompleted: [],
      };
      this.dailyStats.set(key, stats);
    }
    return stats;
  }

  getStreak(userId: string): StreakData {
    let streak = this.streaks.get(userId);
    if (!streak) {
      streak = {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: getTodayDateString(),
        freezeCount: 1,
        freezeUsedToday: false,
        isGoalMetToday: false,
      };
      this.streaks.set(userId, streak);
    }
    return streak;
  }

  getSettings(userId: string): UserSettings {
    let settings = this.settings.get(userId);
    if (!settings) {
      settings = {
        breakIntervalMinutes: 20,
        breakDurationSeconds: 20,
        blueLightFilterEnabled: true,
        blueLightAutoMode: true,
        blueLightIntensity: 45,
        blueLightWarmth: 'amber',
        soundEnabled: true,
        notificationsEnabled: true,
        dailyScreenGoalMinutes: 360,
        backgroundModeEnabled: true,
        backgroundAudioAlert: true,
      };
      this.settings.set(userId, settings);
    }
    return settings;
  }

  getDailyChallenges(userId: string): DailyChallenge[] {
    const stats = this.getOrCreateTodayStats(userId);
    return DEFAULT_CHALLENGES.map((ch) => ({
      ...ch,
      completed: stats.challengesCompleted.includes(ch.id),
    }));
  }

  getLeaderboard(currentUserId: string, filter: 'friends' | 'global'): LeaderboardEntry[] {
    const today = getTodayDateString();
    const entries: LeaderboardEntry[] = [];

    this.users.forEach((user) => {
      const statsKey = `${user.id}_${today}`;
      const stats = this.dailyStats.get(statsKey) || {
        pointsEarned: 0,
        breaksCompleted: 0,
        activeScreenSeconds: 0,
        consistencyScore: 80,
      };
      const streak = this.streaks.get(user.id)?.currentStreak || 0;
      const kudos = this.kudos.get(user.id) || 0;

      const isCurrentUser = user.id === currentUserId;
      // Sarah, Marcus, Elena are friends
      const isFriend = isCurrentUser || ['usr_sarah', 'usr_marcus', 'usr_elena'].includes(user.id);

      if (filter === 'friends' && !isFriend) return;

      entries.push({
        userId: user.id,
        name: isCurrentUser ? `${user.name} (You)` : user.name,
        avatar: user.avatar,
        isCurrentUser,
        isFriend,
        points: stats.pointsEarned,
        streak,
        consistencyScore: stats.consistencyScore,
        breaksTaken: stats.breaksCompleted,
        activeMinutes: Math.round(stats.activeScreenSeconds / 60),
        kudosReceived: kudos,
        rank: 0,
      });
    });

    // Sort by points desc, then consistency desc
    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.consistencyScore - a.consistencyScore;
    });

    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }

  logEyeStrain(userId: string, score: number, symptoms: string[], notes?: string): EyeStrainLog {
    const todayStats = this.getOrCreateTodayStats(userId);
    const screenMinutesSoFar = Math.round(todayStats.activeScreenSeconds / 60);
    const log: EyeStrainLog = {
      id: `str_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      score: Math.max(1, Math.min(10, Number(score))),
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      screenMinutesSoFar,
      breaksTakenSoFar: todayStats.breaksCompleted,
      notes: notes || '',
    };
    this.eyeStrainLogs.unshift(log);
    return log;
  }

  getCorrelationData(userId: string): CorrelationDataResponse {
    const todayStats = this.getOrCreateTodayStats(userId);
    const settings = this.getSettings(userId);
    const todayScreenMinutes = Math.round(todayStats.activeScreenSeconds / 60);
    const todayBreaksCompleted = todayStats.breaksCompleted;

    const latestUserLog = this.eyeStrainLogs[0];
    let currentTodayStrain = latestUserLog ? latestUserLog.score : 3.8;
    if (!latestUserLog) {
      const unmitigatedMinutes = Math.max(0, todayScreenMinutes - todayBreaksCompleted * 35);
      currentTodayStrain = Math.min(10, Math.max(1, Number((2.0 + (unmitigatedMinutes / 60) * 1.3).toFixed(1))));
    }

    const dailyHourly: HourlyScreenData[] = [
      { hour: '8 AM', screenMinutes: 15, strainScore: 1.5, breaksTaken: 0 },
      { hour: '9 AM', screenMinutes: 45, strainScore: 2.2, breaksTaken: 1 },
      { hour: '10 AM', screenMinutes: 52, strainScore: 3.1, breaksTaken: 1 },
      { hour: '11 AM', screenMinutes: 50, strainScore: 4.0, breaksTaken: 1 },
      { hour: '12 PM', screenMinutes: 20, strainScore: 2.6, breaksTaken: 1 },
      { hour: '1 PM', screenMinutes: 48, strainScore: 3.9, breaksTaken: 0 },
      { hour: '2 PM', screenMinutes: 56, strainScore: 5.4, breaksTaken: 0 },
      { hour: '3 PM', screenMinutes: 58, strainScore: 7.2, breaksTaken: 0 },
      { hour: '4 PM', screenMinutes: 38, strainScore: 4.5, breaksTaken: 2 },
      { hour: '5 PM', screenMinutes: 44, strainScore: 5.0, breaksTaken: 1 },
      { hour: '6 PM', screenMinutes: Math.min(60, todayScreenMinutes > 300 ? 40 : 25), strainScore: currentTodayStrain, breaksTaken: 1 },
    ];

    const weekly: WeeklyScreenData[] = [
      { day: 'Mon', date: 'Sep 12', screenHours: 6.2, strainScore: 5.6, breaksTaken: 6, targetHours: 6 },
      { day: 'Tue', date: 'Sep 13', screenHours: 7.8, strainScore: 8.4, breaksTaken: 3, targetHours: 6 },
      { day: 'Wed', date: 'Sep 14', screenHours: 4.8, strainScore: 3.2, breaksTaken: 8, targetHours: 6 },
      { day: 'Thu', date: 'Sep 15', screenHours: 6.6, strainScore: 6.0, breaksTaken: 5, targetHours: 6 },
      { day: 'Fri', date: 'Sep 16', screenHours: 7.4, strainScore: 7.6, breaksTaken: 4, targetHours: 6 },
      { day: 'Sat', date: 'Sep 17', screenHours: 3.2, strainScore: 2.4, breaksTaken: 4, targetHours: 4 },
      { day: 'Sun', date: 'Sep 18', screenHours: Number((todayScreenMinutes / 60).toFixed(1)) || 4.2, strainScore: currentTodayStrain, breaksTaken: todayBreaksCompleted || 5, targetHours: 6 },
    ];

    const correlationStats: CorrelationStats = {
      pearsonR: 0.84,
      correlationLabel: 'Strong Positive',
      criticalThresholdHours: 4.2,
      strainReductionPercent: 42,
      currentTodayStrain,
      peakStrainTime: '2:30 PM – 4:45 PM',
      totalBreakProtectionCount: weekly.reduce((acc, d) => acc + d.breaksTaken, 0),
    };

    const recommendations: EyeHealthRecommendation[] = [
      {
        id: 'rec_afternoon_spike',
        title: 'Mid-Afternoon Strain Surge Protection',
        category: 'frequency',
        priority: 'high',
        insight: 'Your ocular strain sharpens by +62% between 2:30 PM and 4:30 PM after 3.5 continuous screen hours. Increasing break frequency cuts strain spikes by nearly half.',
        actionText: 'Switch to 15m Break Interval',
        actionType: 'set_interval_15',
        actionPayload: '15',
      },
      {
        id: 'rec_blinking_restoration',
        title: 'Restorative Micro-Blink Protocol',
        category: 'exercise',
        priority: 'high',
        insight: 'Concentrated screen tasks inhibit spontaneous blinking by up to 66%, triggering rapid tear film evaporation and dry burning sensations.',
        actionText: 'Start Hydrating Micro-Blinks (30s)',
        actionType: 'start_challenge',
        actionPayload: 'ch_blink',
      },
      {
        id: 'rec_twilight_filter',
        title: 'Circadian Melatonin & Glare Shield',
        category: 'blue_light',
        priority: 'medium',
        insight: 'Short-wavelength blue light past 6:00 PM increases ciliary muscle tension and delays melatonin release. Warm tones significantly ease evening retinal fatigue.',
        actionText: settings.blueLightFilterEnabled ? 'Filter Active (Warm Amber)' : 'Activate Warm Filter Now',
        actionType: 'toggle_blue_light',
      },
      {
        id: 'rec_near_far',
        title: 'Ciliary Spasm Relief with Focal Shifts',
        category: 'exercise',
        priority: 'medium',
        insight: 'Staring at a fixed 50cm focal plane locks your lens accommodation muscles. Alternating focus to 20+ feet relaxes lens convexity.',
        actionText: 'Start Accommodation Shift (45s)',
        actionType: 'start_challenge',
        actionPayload: 'ch_nearfar',
      },
      {
        id: 'rec_deep_palming',
        title: 'Total Darkness Palming for Photoreceptors',
        category: 'exercise',
        priority: 'tip',
        insight: 'Cup warm hands over closed eyes for 60 seconds without pressure. Total darkness allows rhodopsin in retinal rods to chemically regenerate.',
        actionText: 'Start Palming Session (60s)',
        actionType: 'start_challenge',
        actionPayload: 'ch_palm',
      },
    ];

    return {
      dailyHourly,
      weekly,
      correlationStats,
      recommendations,
      recentLogs: this.eyeStrainLogs.slice(0, 10),
      todayScreenMinutes,
      todayBreaksCompleted,
    };
  }
}

export const db = new Database();
