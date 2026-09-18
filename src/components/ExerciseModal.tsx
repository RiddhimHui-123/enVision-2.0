import React, { useState, useEffect } from 'react';
import { DailyChallenge } from '../types.ts';
import { X, CheckCircle2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio.ts';

interface ExerciseModalProps {
  challenge: DailyChallenge | null;
  onClose: () => void;
  onFinishExercise: (challenge: DailyChallenge) => void;
  soundEnabled: boolean;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  challenge,
  onClose,
  onFinishExercise,
  soundEnabled,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(!soundEnabled);

  // Focus shift state
  const [focusDistance, setFocusDistance] = useState<'near' | 'far'>('near');

  // Blinking step state
  const [blinkPhase, setBlinkPhase] = useState<'close' | 'squeeze' | 'open'>('close');

  // Figure-8 dot progress
  const [animProgress, setAnimProgress] = useState<number>(0);

  useEffect(() => {
    if (challenge) {
      setSecondsLeft(challenge.durationSeconds);
      setIsDone(false);
      setFocusDistance('near');
      setBlinkPhase('close');
      setAnimProgress(0);
      if (!muted) {
        sound.playBreakStart();
      }
    }
  }, [challenge, muted]);

  // Main timer
  useEffect(() => {
    if (!challenge || isDone) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDone(true);
          if (!muted) {
            sound.playSuccess();
          }
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2D6A4F', '#52B788', '#F4A261', '#E76F51'],
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge, isDone, muted]);

  // Exercise specific dynamic animations
  useEffect(() => {
    if (!challenge || isDone) return;

    // Near-far switch every 5 seconds
    if (challenge.type === 'near-far') {
      const nfInterval = setInterval(() => {
        setFocusDistance((prev) => (prev === 'near' ? 'far' : 'near'));
        if (!muted) sound.playTick();
      }, 5000);
      return () => clearInterval(nfInterval);
    }

    // Blinking rhythm cycle every 3 seconds
    if (challenge.type === 'blinking') {
      const blinkInterval = setInterval(() => {
        setBlinkPhase((prev) => {
          if (prev === 'close') return 'squeeze';
          if (prev === 'squeeze') return 'open';
          return 'close';
        });
        if (!muted) sound.playTick();
      }, 2500);
      return () => clearInterval(blinkInterval);
    }

    // Figure-eight requestAnimationFrame loop
    if (challenge.type === 'figure-eight') {
      let frameId: number;
      const start = Date.now();
      const loop = () => {
        const elapsed = (Date.now() - start) / 1000;
        // 1 full infinity cycle every 5 seconds
        setAnimProgress((elapsed % 5) / 5);
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
    }
  }, [challenge, isDone, muted]);

  if (!challenge) return null;

  // Calculate figure-8 dot coordinates (Lemniscate of Bernoulli parametric)
  // x = a * cos(t) / (1 + sin^2(t)), y = a * sin(t)cos(t) / (1 + sin^2(t))
  const t = animProgress * 2 * Math.PI;
  const scale = 110;
  const denom = 1 + Math.sin(t) * Math.sin(t);
  const figX = 140 + (scale * Math.cos(t)) / denom;
  const figY = 80 + (scale * Math.sin(t) * Math.cos(t)) / denom;

  return (
    <div
      id="exercise-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
    >
      <div
        id="exercise-modal-container"
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 relative overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Daily Challenge
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {secondsLeft > 0 ? `${secondsLeft}s remaining` : 'Complete!'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="exercise-sound-toggle-btn"
              onClick={() => setMuted((prev) => !prev)}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              id="exercise-close-btn"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Instructions */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold mb-1">{challenge.title}</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            {challenge.description}
          </p>
        </div>

        {/* Interactive Guide Canvas Area */}
        <div className="w-full h-52 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800 flex flex-col items-center justify-center relative overflow-hidden mb-6">
          {/* 1. Figure 8 Guide */}
          {challenge.type === 'figure-eight' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <svg className="w-72 h-40" viewBox="0 0 280 160">
                {/* Visual path guideline */}
                <path
                  d="M 140 80 C 180 30, 240 30, 240 80 C 240 130, 180 130, 140 80 C 100 30, 40 30, 40 80 C 40 130, 100 130, 140 80 Z"
                  fill="none"
                  stroke="currentColor"
                  className="text-stone-200 dark:text-stone-800"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Moving tracking dot */}
                <circle
                  cx={figX}
                  cy={figY}
                  r="12"
                  className="fill-emerald-500 shadow-lg drop-shadow"
                />
                <circle
                  cx={figX}
                  cy={figY}
                  r="5"
                  className="fill-white"
                />
              </svg>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                Keep your head steady — track the glowing dot with your eyes only
              </span>
            </div>
          )}

          {/* 2. Near-Far Focus Shifts */}
          {challenge.type === 'near-far' && (
            <div className="flex flex-col items-center justify-center p-4">
              <div
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700 shadow-md ${
                  focusDistance === 'near'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 scale-110'
                    : 'border-amber-500 bg-amber-50 dark:bg-amber-950/70 scale-90'
                }`}
              >
                <span className="text-2xl font-black text-stone-800 dark:text-stone-100">
                  {focusDistance === 'near' ? 'NEAR' : 'FAR'}
                </span>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  {focusDistance === 'near' ? 'Thumb / 10 inches' : 'Horizon / 20+ ft'}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-3 text-center">
                {focusDistance === 'near'
                  ? '👉 Focus sharply on your thumb held 10 inches away'
                  : '🏔️ Gaze past your thumb at an object across the room'}
              </p>
            </div>
          )}

          {/* 3. Hydrating Micro-Blinks */}
          {challenge.type === 'blinking' && (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 transition-transform duration-500">
                {blinkPhase === 'close' && (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold">— —</span>
                    <span className="text-[11px] font-bold mt-1">Soft Close</span>
                  </div>
                )}
                {blinkPhase === 'squeeze' && (
                  <div className="flex flex-col items-center animate-pulse">
                    <span className="text-2xl font-black">&gt; &lt;</span>
                    <span className="text-[11px] font-bold mt-1">Gentle Squeeze</span>
                  </div>
                )}
                {blinkPhase === 'open' && (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold">O O</span>
                    <span className="text-[11px] font-bold mt-1">Open & Relax</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                {blinkPhase === 'close' && 'Close eyelids softly without squinting'}
                {blinkPhase === 'squeeze' && 'Squeeze lids gently for 1 sec to stimulate tear glands'}
                {blinkPhase === 'open' && 'Open comfortably and rest your gaze'}
              </span>
            </div>
          )}

          {/* 4. Deep Palming */}
          {challenge.type === 'palming' && (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 animate-pulse">
                <span className="text-3xl">🤲</span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-200 font-medium max-w-xs">
                Rub your palms together until warm. Cup them gently over closed eyes without
                pressing the eyeballs. Soak in soothing blackness.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isDone ? (
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{challenge.points} XP Earned!</span>
            </div>
            <button
              id="finish-exercise-claim-btn"
              onClick={() => onFinishExercise(challenge)}
              className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Progress & Return</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-1000"
                style={{
                  width: `${((challenge.durationSeconds - secondsLeft) / challenge.durationSeconds) * 100}%`,
                }}
              />
            </div>
            <button
              id="early-complete-exercise-btn"
              onClick={() => {
                setIsDone(true);
                if (!muted) sound.playSuccess();
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              I Finished Early
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
