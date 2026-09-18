import React, { useState } from 'react';
import { LeaderboardEntry } from '../types.ts';
import { Trophy, Flame, ShieldCheck, Heart, UserPlus, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  activeFilter: 'friends' | 'global';
  onFilterChange: (filter: 'friends' | 'global') => void;
  onSendKudos: (userId: string) => void;
  sortBy: 'points' | 'consistency';
  onSortChange: (sort: 'points' | 'consistency') => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  activeFilter,
  onFilterChange,
  onSendKudos,
  sortBy,
  onSortChange,
}) => {
  const [friendInput, setFriendInput] = useState('');
  const [friendSuccessToast, setFriendSuccessToast] = useState<string | null>(null);
  const [kudosGivenUsers, setKudosGivenUsers] = useState<Record<string, boolean>>({});

  const handleKudosClick = (userId: string) => {
    sound.playKudos();
    setKudosGivenUsers((prev) => ({ ...prev, [userId]: true }));
    onSendKudos(userId);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim()) return;
    setFriendSuccessToast(`Added ${friendInput.trim()} to your eye-health circle!`);
    setFriendInput('');
    setTimeout(() => setFriendSuccessToast(null), 3500);
  };

  // Sort entries according to current sortBy
  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === 'consistency') {
      if (b.consistencyScore !== a.consistencyScore) {
        return b.consistencyScore - a.consistencyScore;
      }
      return b.points - a.points;
    }
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.consistencyScore - a.consistencyScore;
  });

  return (
    <div id="leaderboard-page" className="w-full flex flex-col gap-6">
      {/* Header Banner - Strava style healthy mindset notice */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30 border border-emerald-200/60 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Eye-Health Leaderboard
            </h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xl leading-relaxed">
            Healthy competition, not shame-based. Points celebrate taking timely 20-20-20 breaks,
            exercising ocular focus, and preserving a balanced screen habit.
          </p>
        </div>

        {/* Filter Toggle (Friends / Global) */}
        <div className="flex items-center bg-white dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm shrink-0">
          <button
            id="tab-friends-btn"
            onClick={() => onFilterChange('friends')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'friends'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Friends Circle
          </button>
          <button
            id="tab-global-btn"
            onClick={() => onFilterChange('global')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'global'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Global Arena
          </button>
        </div>
      </div>

      {/* Control bar: Sorting + Add friend */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Rank by:</span>
          <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800/80 p-0.5 border border-stone-200/70 dark:border-stone-700/60">
            <button
              id="sort-by-points-btn"
              onClick={() => onSortChange('points')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                sortBy === 'points'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Points & XP
            </button>
            <button
              id="sort-by-consistency-btn"
              onClick={() => onSortChange('consistency')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                sortBy === 'consistency'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Break Consistency %
            </button>
          </div>
        </div>

        {/* Quick friend search / add */}
        <form onSubmit={handleAddFriend} className="flex items-center gap-2">
          <div className="relative">
            <input
              id="friend-input"
              type="text"
              placeholder="Add friend by username..."
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-emerald-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 w-52 sm:w-60"
            />
          </div>
          <button
            id="add-friend-btn"
            type="submit"
            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center"
            title="Invite or add friend"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {friendSuccessToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{friendSuccessToast}</span>
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      <div className="flex flex-col gap-2.5">
        {sortedEntries.map((entry, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const hasGivenKudos = kudosGivenUsers[entry.userId];

          return (
            <div
              key={entry.userId}
              id={`leaderboard-row-${entry.userId}`}
              className={`p-4 rounded-2xl transition-all border flex items-center justify-between gap-3 sm:gap-4 ${
                entry.isCurrentUser
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/80 shadow-xs ring-1 ring-emerald-400/30'
                  : 'bg-white dark:bg-stone-900/90 border-stone-200/80 dark:border-stone-800 hover:border-emerald-200 dark:hover:border-emerald-900/60'
              }`}
            >
              {/* Left: Rank & Avatar & Details */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Badge */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  {rank === 1 && (
                    <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                      1
                    </span>
                  )}
                  {rank === 2 && (
                    <span className="w-7 h-7 rounded-full bg-stone-300 dark:bg-stone-600 text-stone-900 dark:text-stone-100 flex items-center justify-center font-black text-xs">
                      2
                    </span>
                  )}
                  {rank === 3 && (
                    <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                      3
                    </span>
                  )}
                  {rank > 3 && (
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 font-mono">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                    referrerPolicy="no-referrer"
                  />
                  {entry.streak >= 5 && (
                    <span
                      title={`${entry.streak} day streak!`}
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]"
                    >
                      🔥
                    </span>
                  )}
                </div>

                {/* Name & Subtitle */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold truncate text-stone-900 dark:text-stone-100">
                      {entry.name}
                    </span>
                    {isTop3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                        Top 3
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{entry.consistencyScore}% consistency</span>
                    </span>
                    <span>•</span>
                    <span>{entry.breaksTaken} breaks</span>
                  </div>
                </div>
              </div>

              {/* Right: Points, Streak, Kudos */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Points */}
                <div className="text-right">
                  <div className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    {entry.points} XP
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center justify-end gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>{entry.streak}d streak</span>
                  </div>
                </div>

                {/* Kudos Button (Strava-like High Five) */}
                {!entry.isCurrentUser ? (
                  <button
                    id={`kudos-btn-${entry.userId}`}
                    onClick={() => handleKudosClick(entry.userId)}
                    disabled={hasGivenKudos}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      hasGivenKudos
                        ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 cursor-default'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-stone-600 dark:text-stone-300 hover:text-rose-600'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasGivenKudos ? 'fill-rose-500 text-rose-500 animate-ping' : ''
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {hasGivenKudos ? 'Kudos Sent!' : 'Kudos'}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      {entry.kudosReceived + (hasGivenKudos ? 1 : 0)}
                    </span>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 text-xs text-stone-400 font-mono flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-400" />
                    <span>{entry.kudosReceived}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
