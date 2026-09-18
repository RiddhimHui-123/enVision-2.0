import React, { useState } from 'react';
import { UserSettings, StreakData } from '../types.ts';
import { X, Volume2, VolumeX, Snowflake, SunMedium, Bell, Check, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  streak: StreakData;
  userPoints: number;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onBuyStreakFreeze: () => void;
  onResetOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  streak,
  userPoints,
  onUpdateSettings,
  onBuyStreakFreeze,
  onResetOnboarding,
}) => {
  const [freezeMsg, setFreezeMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchaseFreeze = () => {
    if (userPoints < 100) {
      setFreezeMsg('You need at least 100 XP to acquire a Streak Freeze.');
      setTimeout(() => setFreezeMsg(null), 3000);
      return;
    }
    onBuyStreakFreeze();
    setFreezeMsg('Streak Freeze acquired! Your streak is safely shielded.');
    setTimeout(() => setFreezeMsg(null), 3500);
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
    >
      <div
        id="settings-modal-container"
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">App Preferences</h2>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-sm">
          {/* 1. 20-20-20 Break Interval */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                Break Frequency
              </span>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                {settings.breakIntervalMinutes === 0.17
                  ? '10s Demo'
                  : `Every ${settings.breakIntervalMinutes} mins`}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              Standard clinical 20-20-20 rule prompts every 20 minutes. Choose a frequency or rapid
              test mode:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '10s Test', val: 0.17 },
                { label: '15 min', val: 15 },
                { label: '20 min (Rec)', val: 20 },
                { label: '30 min', val: 30 },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  id={`interval-btn-${item.val}`}
                  onClick={() => onUpdateSettings({ breakIntervalMinutes: item.val })}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition text-center ${
                    settings.breakIntervalMinutes === item.val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Blue Light Filter Tuning */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SunMedium className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  Blue Light Warmth Filter
                </span>
              </div>
              <button
                id="toggle-filter-settings-btn"
                onClick={() =>
                  onUpdateSettings({ blueLightFilterEnabled: !settings.blueLightFilterEnabled })
                }
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  settings.blueLightFilterEnabled
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                }`}
              >
                {settings.blueLightFilterEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Auto Mode toggle */}
            <div className="flex items-center justify-between py-2 border-b border-stone-200/50 dark:border-stone-800 text-xs">
              <span className="text-stone-600 dark:text-stone-400">
                Auto-activate at sunset or in dark rooms
              </span>
              <button
                id="toggle-filter-auto-btn"
                onClick={() => onUpdateSettings({ blueLightAutoMode: !settings.blueLightAutoMode })}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  settings.blueLightAutoMode ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.blueLightAutoMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Intensity slider */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-500">Warmth Intensity</span>
                <span className="font-bold font-mono">{settings.blueLightIntensity}%</span>
              </div>
              <input
                id="bluelight-intensity-slider"
                type="range"
                min="10"
                max="90"
                value={settings.blueLightIntensity}
                onChange={(e) =>
                  onUpdateSettings({ blueLightIntensity: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Warmth Tone Selection */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-stone-500">Color Tone:</span>
              {(['amber', 'candle', 'twilight'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  id={`tone-btn-${tone}`}
                  onClick={() => onUpdateSettings({ blueLightWarmth: tone })}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium transition ${
                    settings.blueLightWarmth === tone
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-400'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sound and Notifications */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="sound-toggle-pref-btn"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                settings.soundEnabled
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-stone-900 dark:text-stone-100'
                  : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-500'
              }`}
            >
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                )}
                <span className="text-xs font-bold">Sound Chimes</span>
              </div>
              {settings.soundEnabled && <Check className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              type="button"
              id="notif-toggle-pref-btn"
              onClick={async () => {
                if (typeof window !== 'undefined' && 'Notification' in window) {
                  await Notification.requestPermission();
                }
                onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled });
              }}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                settings.notificationsEnabled
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-stone-900 dark:text-stone-100'
                  : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold">Notifications</span>
              </div>
              {settings.notificationsEnabled && <Check className="w-4 h-4 text-emerald-600" />}
            </button>
          </div>

          {/* 3b. Background Break Mode Engine */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                  Run Break Mode in Background
                </span>
              </div>
              <button
                id="toggle-background-mode-settings-btn"
                onClick={() =>
                  onUpdateSettings({ backgroundModeEnabled: !settings.backgroundModeEnabled })
                }
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  settings.backgroundModeEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                }`}
              >
                {settings.backgroundModeEnabled ? 'Active' : 'Off'}
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              When enabled, enVision tracks screen sessions using a background Web Worker and alerts you via system notifications and resonant chime even when working in other tabs or apps.
            </p>
          </div>

          {/* 4. Streak Freeze Management (Duolingo Style) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200/80 dark:border-cyan-900/50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                    Streak Freeze Shield
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    You have {streak.freezeCount} shield{streak.freezeCount === 1 ? '' : 's'}{' '}
                    equipped
                  </span>
                </div>
              </div>

              <button
                id="buy-freeze-btn"
                onClick={handlePurchaseFreeze}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Buy for 100 XP</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              Protects your streak if you miss a day due to travel or rest. One freeze automatically
              redeems to save your progress.
            </p>
            {freezeMsg && (
              <p className="mt-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                {freezeMsg}
              </p>
            )}
          </div>

          {/* Reset Onboarding / Calibration */}
          <div className="pt-2 flex justify-between items-center text-xs text-stone-400">
            <span>Need to re-calibrate goals?</span>
            <button
              id="reset-onboarding-btn"
              onClick={() => {
                onClose();
                onResetOnboarding();
              }}
              className="text-stone-600 dark:text-stone-300 hover:underline"
            >
              Rerun Onboarding Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
