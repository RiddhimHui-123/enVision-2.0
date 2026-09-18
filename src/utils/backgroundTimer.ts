// Web Worker-backed precision timer that runs reliably even when the tab is in the background or minimized
type TickCallback = () => void;

class BackgroundTimerService {
  private worker: Worker | null = null;
  private onTickCallback: TickCallback | null = null;
  private isRunning: boolean = false;
  private fallbackInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;

    try {
      const workerCode = `
        let timerId = null;
        self.onmessage = function(e) {
          if (e.data === 'START') {
            if (timerId) clearInterval(timerId);
            timerId = setInterval(function() {
              self.postMessage('TICK');
            }, 1000);
          } else if (e.data === 'STOP') {
            if (timerId) {
              clearInterval(timerId);
              timerId = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (e) => {
        if (e.data === 'TICK' && this.isRunning && this.onTickCallback) {
          this.onTickCallback();
        }
      };
    } catch (err) {
      console.warn('Web Worker initialization fallback:', err);
    }
  }

  public start(onTick: TickCallback) {
    this.onTickCallback = onTick;
    this.isRunning = true;

    if (this.worker) {
      this.worker.postMessage('START');
    } else {
      if (this.fallbackInterval) clearInterval(this.fallbackInterval);
      this.fallbackInterval = setInterval(() => {
        if (this.isRunning && this.onTickCallback) {
          this.onTickCallback();
        }
      }, 1000);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.worker) {
      this.worker.postMessage('STOP');
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }
}

export const backgroundTimer = new BackgroundTimerService();
