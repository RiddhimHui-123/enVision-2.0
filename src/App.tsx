import { useState, useEffect, useCallback } from 'react';
import {
  User,
  DailyStats,
  StreakData,
  DailyChallenge,
  LeaderboardEntry,
  UserSettings,
  TabType,
} from './types.ts';
import { useScreenTracker } from './hooks/useScreenTracker.ts';
import { sound } from './utils/audio.ts';
import { BlueLightOverlay } from './components/BlueLightOverlay.tsx';
import { BreakModal } from './components/BreakModal.tsx';
import { ExerciseModal } from './components/ExerciseModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import {
  Eye,
  Flame,
  Sparkles,
  Trophy,
  LayoutDashboard,
  Settings as SettingsIcon,
  Snowflake,
  Bell,
  SunMedium,
  Activity,
} from 'lucide-react';

const INITIAL_STREAK: StreakData = {
  currentStreak: 5,
  longestStreak: 12,
  lastActiveDate: new Date().toISOString().split('T')[0],
  freezeCount: 2,
  freezeUsedToday: false,
  isGoalMetToday: false,
};

const INITIAL_STATS: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  userId: 'usr_me',
  activeScreenSeconds: 4200,
  breaksCompleted: 2,
  breaksTarget: 4,
  exercisesCompleted: 1,
  exercisesTarget: 3,
  pointsEarned: 140,
  consistencyScore: 88,
  challengesCompleted: ['ch_fig8'],
};

const INITIAL_SETTINGS: UserSettings = {
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [streak, setStreak] = useState<StreakData>(INITIAL_STREAK);
  const [todayStats, setTodayStats] = useState<DailyStats>(INITIAL_STATS);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isBreakModalOpen, setIsBreakModalOpen] = useState<boolean>(false);
  const [activeChallenge, setActiveChallenge] = useState<DailyChallenge | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Leaderboard filters
  const [leaderboardFilter, setLeaderboardFilter] = useState<'friends' | 'global'>('friends');
  const [leaderboardSort, setLeaderboardSort] = useState<'points' | 'consistency'>('points');

  // Sync sound utility state
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Fetch initial state from backend
  const loadInitialData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStreak(data.streak);
        setTodayStats(data.todayStats);
        setSettings(data.settings);
        setChallenges(data.challenges);
      }
    } catch {
      // Fallback to initial local state
    }
  }, []);

  // Fetch leaderboard
  const loadLeaderboard = useCallback(async (filter: 'friends' | 'global') => {
    try {
      const res = await fetch(`/api/leaderboard?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    loadLeaderboard('friends');

    // Check if first-time user
    const hasOnboarded =
      localStorage.getItem('envision_onboarded') || localStorage.getItem('blinkr_onboarded');
    if (!hasOnboarded) {
      setIsOnboardingOpen(true);
    }
  }, [loadInitialData, loadLeaderboard]);

  useEffect(() => {
    loadLeaderboard(leaderboardFilter);
  }, [leaderboardFilter, loadLeaderboard]);

  // 20-20-20 Trigger handler
  const handleBreakTrigger = useCallback(() => {
    setIsBreakModalOpen(true);

    // Trigger browser Notification if permitted
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification('20-20-20 Eye Break Time!', {
          body: 'Look at something 20 feet (6m) away for 20 seconds to relax your eye muscles.',
          icon: '/favicon.ico',
        });
      } catch {
        // Ignore notification errors in iframe
      }
    }
  }, []);

  // Heartbeat activity sync to backend
  const handleActivityHeartbeat = useCallback(async (activeSeconds: number) => {
    try {
      const res = await fetch('/api/stats/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSecondsToAdd: activeSeconds }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodayStats((prev) => ({
          ...prev,
          activeScreenSeconds: data.activeScreenSeconds,
          consistencyScore: data.consistencyScore,
        }));
      }
    } catch {
      // Ignore heartbeat network drop
    }
  }, []);

  // Screen tracker hook (privacy-conscious, background Web Worker powered)
  const {
    secondsRemaining,
    isActiveScreen,
    isPaused: isTimerPaused,
    togglePause: handleTogglePauseTimer,
    forceTriggerBreak,
    testBackgroundBreak,
  } = useScreenTracker({
    breakIntervalMinutes: settings.breakIntervalMinutes,
    onBreakTrigger: handleBreakTrigger,
    onActivityHeartbeat: handleActivityHeartbeat,
    enabled: true,
    backgroundModeEnabled: settings.backgroundModeEnabled,
    backgroundAudioAlert: settings.backgroundAudioAlert,
  });

  // Break modal completion (+50 XP)
  const handleCompleteBreak = async () => {
    setIsBreakModalOpen(false);
    try {
      const res = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', durationSeconds: 20 }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodayStats(data.todayStats);
        setStreak(data.streak);
        loadLeaderboard(leaderboardFilter);
      }
    } catch {
      // Local optimistic update
      setTodayStats((prev) => ({
        ...prev,
        breaksCompleted: prev.breaksCompleted + 1,
        pointsEarned: prev.pointsEarned + 50,
      }));
    }
  };

  const handleSkipBreak = async () => {
    setIsBreakModalOpen(false);
    try {
      await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped' }),
      });
    } catch {
      // Ignore
    }
  };

  // Exercise challenge completed
  const handleFinishExercise = async (challenge: DailyChallenge) => {
    setActiveChallenge(null);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: challenge.id,
          exerciseTitle: challenge.title,
          durationSeconds: challenge.durationSeconds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodayStats(data.todayStats);
        setStreak(data.streak);
        setChallenges(data.challenges);
        loadLeaderboard(leaderboardFilter);
      }
    } catch {
      setChallenges((prev) =>
        prev.map((c) => (c.id === challenge.id ? { ...c, completed: true } : c))
      );
    }
  };

  // Send Kudos on leaderboard
  const handleSendKudos = async (targetUserId: string) => {
    try {
      await fetch('/api/kudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      loadLeaderboard(leaderboardFilter);
    } catch {
      // Ignore
    }
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch {
      // Ignore
    }
  };

  // Buy Streak Freeze
  const handleBuyStreakFreeze = async () => {
    try {
      const res = await fetch('/api/streak/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purchase' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak);
        setTodayStats((prev) => ({
          ...prev,
          pointsEarned: Math.max(0, prev.pointsEarned - 100),
        }));
      }
    } catch {
      // Ignore
    }
  };

  // Finish onboarding
  const handleOnboardingFinish = (prefs: {
    dailyScreenGoalMinutes: number;
    breakStyle: 'gentle' | 'visual' | 'stretch';
    notificationsEnabled: boolean;
  }) => {
    localStorage.setItem('envision_onboarded', 'true');
    setIsOnboardingOpen(false);
    handleUpdateSettings({
      dailyScreenGoalMinutes: prefs.dailyScreenGoalMinutes,
      notificationsEnabled: prefs.notificationsEnabled,
    });
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-[#F7F9F6] dark:bg-[#161917] text-stone-900 dark:text-stone-100 flex flex-col antialiased selection:bg-emerald-200 selection:text-emerald-900"
    >
      {/* Auto Night / Dark-Room Blue Light Filter Overlay */}
      <BlueLightOverlay settings={settings} onUpdateSettings={handleUpdateSettings} />

      {/* Top App Header */}
      <header
        id="main-nav-header"
        className="sticky top-0 z-30 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-stone-100">
                  enVision
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Eye Companion
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Strava & Duolingo for your eyes
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl border border-stone-200/70 dark:border-stone-700/60">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Strain Analytics</span>
            </button>
            <button
              id="nav-tab-leaderboard"
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
          </nav>

          {/* Right Status Badges (Streak, Points, Freeze, Settings) */}
          <div className="flex items-center gap-2">
            {/* Duolingo Streak Pill */}
            <div
              id="header-streak-pill"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-extrabold shadow-xs"
              title={`${streak.currentStreak} day streak! Keep it going with daily breaks.`}
            >
              <Flame className="w-4 h-4 fill-amber-500 animate-pulse" />
              <span>{streak.currentStreak}</span>
            </div>

            {/* Points Pill */}
            <div
              id="header-points-pill"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold shadow-xs"
              title="Today's Eye Health XP"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{todayStats.pointsEarned} XP</span>
            </div>

            {/* Streak Freeze count */}
            <div
              id="header-freeze-pill"
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/70 dark:border-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold"
              title={`${streak.freezeCount} Streak Freeze equipped`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{streak.freezeCount}</span>
            </div>

            {/* Settings button */}
            <button
              id="open-settings-header-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="App Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            streak={streak}
            todayStats={todayStats}
            challenges={challenges}
            settings={settings}
            secondsRemaining={secondsRemaining}
            isTimerPaused={isTimerPaused}
            isActiveScreen={isActiveScreen}
            onTogglePauseTimer={handleTogglePauseTimer}
            onTriggerBreakNow={forceTriggerBreak}
            onStartExercise={(challenge) => setActiveChallenge(challenge)}
            onEquipStreakFreeze={() => setIsSettingsOpen(true)}
            onToggleBlueLight={() =>
              handleUpdateSettings({
                blueLightFilterEnabled: !settings.blueLightFilterEnabled,
              })
            }
            onNavigateToAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            settings={settings}
            challenges={challenges}
            onUpdateSettings={handleUpdateSettings}
            onStartExercise={(challenge) => setActiveChallenge(challenge)}
            onTriggerBreakNow={forceTriggerBreak}
            onTestBackgroundBreak={(sec) => testBackgroundBreak(sec)}
            activeScreenSeconds={todayStats.activeScreenSeconds}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboard}
            activeFilter={leaderboardFilter}
            onFilterChange={(f) => setLeaderboardFilter(f)}
            onSendKudos={handleSendKudos}
            sortBy={leaderboardSort}
            onSortChange={(s) => setLeaderboardSort(s)}
          />
        )}
      </main>

      {/* Footer info & gentle reminder */}
      <footer className="w-full border-t border-stone-200/70 dark:border-stone-800 py-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700 dark:text-stone-300">enVision Companion</span>
            <span>•</span>
            <span>Clinical 20-20-20 habit engine for digital wellness</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition"
            >
              Preferences
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition"
            >
              Goal Guide
            </button>
            <span className="text-stone-400 font-mono">100% Privacy Protected</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BreakModal
        isOpen={isBreakModalOpen}
        onComplete={handleCompleteBreak}
        onSkip={handleSkipBreak}
        soundEnabled={settings.soundEnabled}
      />

      <ExerciseModal
        challenge={activeChallenge}
        onClose={() => setActiveChallenge(null)}
        onFinishExercise={handleFinishExercise}
        soundEnabled={settings.soundEnabled}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onFinish={handleOnboardingFinish}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        streak={streak}
        userPoints={todayStats.pointsEarned}
        onUpdateSettings={handleUpdateSettings}
        onBuyStreakFreeze={handleBuyStreakFreeze}
        onResetOnboarding={() => setIsOnboardingOpen(true)}
      />
    </div>
  );
}
