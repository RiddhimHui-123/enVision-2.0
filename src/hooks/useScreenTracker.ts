import { useState, useEffect, useRef, useCallback } from 'react';
import { backgroundTimer } from '../utils/backgroundTimer.ts';
import { backgroundNotification } from '../utils/backgroundNotification.ts';

interface UseScreenTrackerOptions {
  breakIntervalMinutes: number;
  onBreakTrigger: () => void;
  onActivityHeartbeat: (activeSeconds: number) => void;
  enabled?: boolean;
  backgroundModeEnabled?: boolean;
  backgroundAudioAlert?: boolean;
}

export function useScreenTracker({
  breakIntervalMinutes,
  onBreakTrigger,
  onActivityHeartbeat,
  enabled = true,
  backgroundModeEnabled = true,
  backgroundAudioAlert = true,
}: UseScreenTrackerOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(breakIntervalMinutes * 60);
  const [isActiveScreen, setIsActiveScreen] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sessionActiveSeconds, setSessionActiveSeconds] = useState<number>(0);

  const lastActivityTimeRef = useRef<number>(Date.now());
  const intervalMinutesRef = useRef<number>(breakIntervalMinutes);
  intervalMinutesRef.current = breakIntervalMinutes;

  const backgroundModeRef = useRef<boolean>(backgroundModeEnabled);
  backgroundModeRef.current = backgroundModeEnabled;

  const audioAlertRef = useRef<boolean>(backgroundAudioAlert);
  audioAlertRef.current = backgroundAudioAlert;

  const onBreakTriggerRef = useRef(onBreakTrigger);
  onBreakTriggerRef.current = onBreakTrigger;

  // Reset countdown when break interval setting changes
  useEffect(() => {
    setSecondsRemaining(breakIntervalMinutes * 60);
  }, [breakIntervalMinutes]);

  // Activity tracking: mouse, scroll, keyboard to detect idle state
  useEffect(() => {
    if (!enabled) return;

    const handleUserActivity = () => {
      lastActivityTimeRef.current = Date.now();
      setIsActiveScreen(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!backgroundModeRef.current) {
          setIsActiveScreen(false);
        }
      } else {
        lastActivityTimeRef.current = Date.now();
        setIsActiveScreen(true);
        // Clear title flashing if user returned to tab
        backgroundNotification.stopTitleFlashing();
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Main ticker loop using backgroundTimer Web Worker
  useEffect(() => {
    if (!enabled || isPaused) {
      backgroundTimer.stop();
      return;
    }

    const handleTick = () => {
      const now = Date.now();
      const isIdle = now - lastActivityTimeRef.current > 180000; // 3m idle check
      const tabHidden = typeof document !== 'undefined' && document.hidden;

      // If background mode is enabled, continue tracking active screen even when on another tab!
      const shouldTrack = backgroundModeRef.current ? !isIdle : (!isIdle && !tabHidden);

      if (shouldTrack) {
        setIsActiveScreen(true);
        setSessionActiveSeconds((prev) => prev + 1);

        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Trigger break
            onBreakTriggerRef.current();

            // If user is currently in another window or tab, fire background desktop notification & sound alert
            if (tabHidden && backgroundModeRef.current) {
              backgroundNotification.triggerBreakAlert({
                audioEnabled: audioAlertRef.current,
                onNotificationClick: () => {
                  window.focus();
                },
              });
            }

            return intervalMinutesRef.current * 60; // Reset for next interval
          }
          return prev - 1;
        });
      } else {
        setIsActiveScreen(false);
      }
    };

    backgroundTimer.start(handleTick);

    return () => {
      backgroundTimer.stop();
    };
  }, [enabled, isPaused]);

  // Periodic heartbeat sync to backend (every 30s)
  useEffect(() => {
    if (!enabled) return;
    const syncInterval = setInterval(() => {
      if (sessionActiveSeconds > 0) {
        onActivityHeartbeat(30);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [enabled, sessionActiveSeconds, onActivityHeartbeat]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setSecondsRemaining(breakIntervalMinutes * 60);
  }, [breakIntervalMinutes]);

  const forceTriggerBreak = useCallback(() => {
    onBreakTriggerRef.current();
  }, []);

  // Ability to test background mode in 5 seconds
  const testBackgroundBreak = useCallback((countdownSeconds: number = 5) => {
    setSecondsRemaining(countdownSeconds);
    // Request notification permission proactively if not decided
    backgroundNotification.requestPermission();
  }, []);

  return {
    secondsRemaining,
    isActiveScreen,
    isPaused,
    sessionActiveSeconds,
    togglePause,
    resetTimer,
    forceTriggerBreak,
    testBackgroundBreak,
  };
}
