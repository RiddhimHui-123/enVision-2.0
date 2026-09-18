import React from 'react';
import {
  DailyStats,
  StreakData,
  DailyChallenge,
  UserSettings,
} from '../types.ts';
import {
  Flame,
  Sparkles,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Circle,
  Eye,
  ShieldAlert,
  Snowflake,
  SunMedium,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  streak: StreakData;
  todayStats: DailyStats;
  challenges: DailyChallenge[];
  settings: UserSettings;
  secondsRemaining: number;
  isTimerPaused: boolean;
  isActiveScreen: boolean;
  onTogglePauseTimer: () => void;
  onTriggerBreakNow: () => void;
  onStartExercise: (challenge: DailyChallenge) => void;
  onEquipStreakFreeze: () => void;
  onToggleBlueLight: () => void;
  onNavigateToAnalytics?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  streak,
  todayStats,
  challenges,
  settings,
  secondsRemaining,
  isTimerPaused,
  isActiveScreen,
  onTogglePauseTimer,
  onTriggerBreakNow,
  onStartExercise,
  onEquipStreakFreeze,
  onToggleBlueLight,
  onNavigateToAnalytics,
}) => {
  // Format MM:SS for next break
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const totalBreakSeconds = settings.breakIntervalMinutes * 60;
  const progressRatio = Math.max(0, Math.min(1, 1 - secondsRemaining / totalBreakSeconds));
  const circleOffset = 251 - 251 * progressRatio;

  // Screen time formatted
  const activeHours = Math.floor(todayStats.activeScreenSeconds / 3600);
  const activeMins = Math.floor((todayStats.activeScreenSeconds % 3600) / 60);
  const screenTimeFormatted =
    activeHours > 0 ? `${activeHours}h ${activeMins}m` : `${activeMins}m`;

  const allCompleted = challenges.length > 0 && challenges.every((c) => c.completed);
  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div id="dashboard-view" className="w-full flex flex-col gap-6">
      {/* Top Grid: Streak + Points + Next Break */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Duolingo-style Streak Card */}
        <div
          id="streak-card"
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Daily Streak
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                  {streak.currentStreak}
                </span>
                <span className="text-sm font-semibold text-stone-500">days</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-500 shadow-xs">
              <Flame className="w-7 h-7 fill-amber-500 animate-pulse" />
            </div>
          </div>

          {/* 7-day Duolingo habit markers */}
          <div className="flex items-center justify-between gap-1 my-2 py-2 px-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800/80">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
              const isToday = idx === 3; // Mock Thursday today
              const isDone = idx <= 3;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-stone-400">{day}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isDone
                        ? 'bg-amber-400 text-stone-900 shadow-xs'
                        : isToday
                        ? 'border-2 border-dashed border-amber-500 text-amber-500'
                        : 'bg-stone-200/60 dark:bg-stone-800 text-stone-400'
                    }`}
                  >
                    {isDone ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Streak Freeze Banner */}
          <div className="flex items-center justify-between pt-2 text-xs border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
              <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                <strong>{streak.freezeCount}</strong> Freeze{streak.freezeCount === 1 ? '' : 's'}{' '}
                available
              </span>
            </div>
            <button
              id="freeze-equip-btn"
              onClick={onEquipStreakFreeze}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              + Get Freeze
            </button>
          </div>
        </div>

        {/* 2. 20-20-20 Next Break Timer Card */}
        <div
          id="next-break-card"
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-200/70 dark:border-emerald-900/60 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Next 20-20-20 Break
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1 font-mono text-stone-900 dark:text-stone-100">
                {timeFormatted}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {isActiveScreen ? 'Active screen time tracking' : 'Idle / Paused'}
              </span>
            </div>

            {/* Radial countdown display */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-stone-100 dark:text-stone-800 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-emerald-500 stroke-current transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray="251"
                  strokeDashoffset={circleOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <Eye className="w-5 h-5 absolute text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              id="trigger-break-now-btn"
              onClick={onTriggerBreakNow}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Break Now</span>
            </button>

            <button
              id="pause-resume-timer-btn"
              onClick={onTogglePauseTimer}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              title={isTimerPaused ? 'Resume tracking' : 'Pause tracking'}
            >
              {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3. Daily Screen Balance & Eye Strain Index */}
        <div
          id="screen-balance-card"
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Eye Health Index
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                  {todayStats.consistencyScore}%
                </span>
                <span className="text-xs font-bold text-emerald-600">Optimal</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 py-2 px-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800/80 text-xs">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Active Screen
              </span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {screenTimeFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Breaks Taken
              </span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {todayStats.breaksCompleted} / {todayStats.breaksTarget}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs border-t border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Today&apos;s XP Earned:</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {todayStats.pointsEarned} XP
            </span>
          </div>
        </div>
      </div>

      {/* Screen Time & Eye Strain Correlation Highlight Card */}
      <div
        id="strain-correlation-highlight-card"
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-950 text-white shadow-md border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Ocular Correlation Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-200">
                r = +0.84 Strong
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-100 mt-0.5">
              Screen Time to Eye Strain Correlation & Personalized Recommendations
            </h3>
            <p className="text-xs text-stone-300 max-w-xl mt-1 leading-relaxed">
              Explore your daily hourly and 7-day weekly curves. 20-20-20 breaks have mitigated your peak ocular fatigue by <strong>42%</strong>.
            </p>
          </div>
        </div>

        {onNavigateToAnalytics && (
          <button
            id="jump-to-analytics-btn"
            onClick={onNavigateToAnalytics}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>Open Strain Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Blue Light Ambient Assistant Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Auto Night & Dark-Room Blue Light Filter
            </h4>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              {settings.blueLightAutoMode
                ? 'Monitors local dusk/dawn and dark environments to soften screen glare automatically.'
                : 'Manual warmth mode active.'}
            </p>
          </div>
        </div>

        <button
          id="toggle-bluelight-dash-btn"
          onClick={onToggleBlueLight}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            settings.blueLightFilterEnabled
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
          }`}
        >
          {settings.blueLightFilterEnabled ? 'Warm Filter Active (On)' : 'Turn On Warm Filter'}
        </button>
      </div>

      {/* Daily Eye Exercise Mini-Challenges Section */}
      <div
        id="challenges-section"
        className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Daily Eye Exercise Mini-Challenges
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {completedCount} of {challenges.length} Done
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Short 30–60s guided ocular muscle stretches. Complete all for +100 bonus streak XP!
            </p>
          </div>

          {allCompleted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Challenges Finished! +100 Bonus</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              id={`challenge-card-${challenge.id}`}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                challenge.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40'
                  : 'bg-stone-50/80 dark:bg-stone-950/50 border-stone-200/70 dark:border-stone-800 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {challenge.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold truncate text-stone-900 dark:text-stone-100">
                      {challenge.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {challenge.durationSeconds}s
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5 line-clamp-2">
                    {challenge.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  +{challenge.points} XP
                </span>

                <button
                  id={`start-challenge-btn-${challenge.id}`}
                  onClick={() => onStartExercise(challenge)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    challenge.completed
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {challenge.completed ? 'Repeat' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
