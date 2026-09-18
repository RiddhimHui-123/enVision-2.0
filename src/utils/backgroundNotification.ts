import { sound } from './audio.ts';

class BackgroundNotificationManager {
  private originalTitle: string = typeof document !== 'undefined' ? document.title : 'enVision — Gamified Eye Health Companion';
  private flashInterval: ReturnType<typeof setInterval> | null = null;
  private isFlashing: boolean = false;

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Trigger alert when break occurs, especially in background
  public triggerBreakAlert(options: {
    audioEnabled?: boolean;
    onNotificationClick?: () => void;
  } = {}) {
    const { audioEnabled = true, onNotificationClick } = options;

    // 1. Play sound
    if (audioEnabled) {
      sound.playBackgroundAlert();
    }

    // 2. Start tab title flashing
    this.startTitleFlashing('🚨 [20-20-20 BREAK] Look 20ft Away!');

    // 3. Dispatch system notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('🔔 20-20-20 Break Time! — enVision', {
          body: 'Look at something 20 feet away for 20 seconds. Relax your ciliary eye muscles!',
          icon: '/favicon.ico',
          tag: 'envision-break-notification',
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          this.stopTitleFlashing();
          if (onNotificationClick) {
            onNotificationClick();
          }
          notification.close();
        };
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  }

  public startTitleFlashing(alertText: string) {
    if (typeof document === 'undefined' || this.isFlashing) return;

    this.originalTitle = document.title.includes('🚨') ? 'enVision — Gamified Eye Health Companion' : document.title;
    this.isFlashing = true;
    let toggle = false;

    if (this.flashInterval) clearInterval(this.flashInterval);
    this.flashInterval = setInterval(() => {
      document.title = toggle ? alertText : '👀 enVision — Rest Your Eyes (Break Active)';
      toggle = !toggle;
    }, 800);
  }

  public stopTitleFlashing() {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    this.isFlashing = false;
    if (typeof document !== 'undefined') {
      document.title = this.originalTitle || 'enVision — Gamified Eye Health Companion';
    }
  }
}

export const backgroundNotification = new BackgroundNotificationManager();
