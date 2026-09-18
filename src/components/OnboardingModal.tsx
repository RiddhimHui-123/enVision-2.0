import React, { useState } from 'react';
import { Eye, Bell, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { UserSettings } from '../types.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: (preferences: {
    dailyScreenGoalMinutes: number;
    breakStyle: 'gentle' | 'visual' | 'stretch';
    notificationsEnabled: boolean;
  }) => void;
  settings: UserSettings;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onFinish,
  settings,
}) => {
  const [step, setStep] = useState<number>(1);
  const [goalHours, setGoalHours] = useState<number>(
    Math.round(settings.dailyScreenGoalMinutes / 60) || 6
  );
  const [breakStyle, setBreakStyle] = useState<'gentle' | 'visual' | 'stretch'>('gentle');
  const [notifsEnabled, setNotifsEnabled] = useState<boolean>(true);

  if (!isOpen) return null;

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifsEnabled(perm === 'granted');
    }
    handleComplete();
  };

  const handleComplete = () => {
    onFinish({
      dailyScreenGoalMinutes: goalHours * 60,
      breakStyle,
      notificationsEnabled: notifsEnabled,
    });
  };

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
    >
      <div
        id="onboarding-modal-container"
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative"
      >
        {/* Step progress pills */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-emerald-600'
                  : i < step
                  ? 'w-4 bg-emerald-400'
                  : 'w-4 bg-stone-200 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Daily Screen Time Target */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Compass className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold tracking-tight mb-1">
              Welcome to enVision!
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-xs">
              Strava meets Duolingo for your eyes. What is your estimated daily screen time?
            </p>

            <div className="w-full grid grid-cols-3 gap-2 mb-6">
              {[4, 6, 8].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  id={`screen-goal-${hours}h`}
                  onClick={() => setGoalHours(hours)}
                  className={`py-3 px-2 rounded-2xl border text-center transition ${
                    goalHours === hours
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-lg font-black block">{hours}h</span>
                  <span className="text-[10px] text-stone-400">
                    {hours <= 4 ? 'Light' : hours <= 6 ? 'Standard' : 'Heavy'}
                  </span>
                </button>
              ))}
            </div>

            <button
              id="onboarding-step1-next"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 transition"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Preferred Break Style */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
              <Eye className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold tracking-tight mb-1">
              Choose your break style
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-xs">
              Every 20 minutes, enVision prompts a 20-20-20 break. How would you like to be prompted?
            </p>

            <div className="w-full flex flex-col gap-2.5 mb-6">
              {[
                {
                  id: 'gentle',
                  title: 'Gentle Chime & Pulse',
                  desc: 'Soothing harmonic chord with soft breathing countdown',
                },
                {
                  id: 'visual',
                  title: 'Visual Focus Shift',
                  desc: 'High-contrast prompt with distance focal point',
                },
                {
                  id: 'stretch',
                  title: 'Active Eye Stretch',
                  desc: 'Quick guided eye movements with 20s rest',
                },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  id={`break-style-${style.id}`}
                  onClick={() => setBreakStyle(style.id as 'gentle' | 'visual' | 'stretch')}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                    breakStyle === style.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-stone-900 dark:text-stone-100 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-emerald-200'
                  }`}
                >
                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      breakStyle === style.id ? 'text-emerald-600' : 'text-stone-300'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold block">{style.title}</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      {style.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-500"
              >
                Back
              </button>
              <button
                id="onboarding-step2-next"
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enable Notifications */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold tracking-tight mb-1">
              Never miss a 20-20-20 break
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-xs">
              Enable browser notifications so enVision can gently remind you when you’re working in
              other tabs or windows.
            </p>

            <div className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 text-left text-xs mb-6 space-y-2">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Earn +50 XP per completed break</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Build streaks and unlock streak freezes</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>100% private: no camera or biometric tracking</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                id="enable-notifs-btn"
                type="button"
                onClick={requestNotificationPermission}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Notifications & Start</span>
              </button>

              <button
                id="skip-notifs-btn"
                type="button"
                onClick={handleComplete}
                className="w-full py-2.5 rounded-xl text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition"
              >
                Maybe later (in-app only)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
