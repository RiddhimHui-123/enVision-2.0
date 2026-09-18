import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, X, Sparkles, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio.ts';

interface BreakModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  soundEnabled: boolean;
}

export const BreakModal: React.FC<BreakModalProps> = ({
  isOpen,
  onComplete,
  onSkip,
  soundEnabled,
}) => {
  const [phase, setPhase] = useState<'prompt' | 'active' | 'completed'>('prompt');
  const [countdown, setCountdown] = useState<number>(20);
  const [audioMuted, setAudioMuted] = useState<boolean>(!soundEnabled);

  // Reset phase and countdown whenever opened
  useEffect(() => {
    if (isOpen) {
      setPhase('prompt');
      setCountdown(20);
      if (!audioMuted) {
        sound.playBreakStart();
      }
    }
  }, [isOpen, audioMuted]);

  // Countdown timer when active
  useEffect(() => {
    if (!isOpen || phase !== 'active') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('completed');
          if (!audioMuted) {
            sound.playSuccess();
          }
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#52B788', '#F4A261', '#74C69D'],
          });
          return 0;
        }
        if (prev % 5 === 0 && !audioMuted) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase, audioMuted]);

  if (!isOpen) return null;

  const progressPercent = ((20 - countdown) / 20) * 100;

  return (
    <div
      id="break-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md transition-opacity"
    >
      <div
        id="break-modal-container"
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative overflow-hidden"
      >
        {/* Audio toggle button */}
        <button
          id="break-sound-toggle-btn"
          onClick={() => setAudioMuted((prev) => !prev)}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          title={audioMuted ? 'Unmute chimes' : 'Mute chimes'}
        >
          {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {phase === 'prompt' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
              <Eye className="w-8 h-8 animate-pulse" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 mb-2">
              20-20-20 Eye Break
            </span>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Time to rest your eyes!
            </h2>

            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
              You’ve been focused on screen for 20 minutes. Shift your gaze to an object{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">20 feet (6 meters)</strong>{' '}
              away for <strong className="text-emerald-700 dark:text-emerald-400">20 seconds</strong>{' '}
              to relax your ciliary muscles.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                id="start-break-countdown-btn"
                onClick={() => setPhase('active')}
                className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Start 20s Break</span>
                <span className="text-xs bg-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                  +50 XP
                </span>
              </button>

              <button
                id="skip-break-btn"
                onClick={onSkip}
                className="w-full py-2.5 px-4 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition"
              >
                Skip this break (no points)
              </button>
            </div>
          </div>
        )}

        {phase === 'active' && (
          <div className="flex flex-col items-center text-center py-2">
            {/* Circular countdown visualization */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-stone-100 dark:text-stone-800 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-emerald-500 stroke-current transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {countdown}
                </span>
                <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                  seconds
                </span>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-1">Look far into the distance</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-xs">
              Look out a window, down a hallway, or at a picture 20 feet away. Blink naturally and
              allow your eye lenses to flatten and unwind.
            </p>

            <button
              id="cancel-break-active-btn"
              onClick={onSkip}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss break</span>
            </button>
          </div>
        )}

        {phase === 'completed' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+50 XP Earned!</span>
            </div>

            <h3 className="text-xl font-bold mb-1">Eyes Refreshed!</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xs mb-6">
              Great habit! Consistent 20-20-20 breaks protect your eye moisture and ciliary muscles.
            </p>

            <button
              id="claim-break-points-btn"
              onClick={onComplete}
              className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 transition"
            >
              Claim & Return to Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
