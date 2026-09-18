import React, { useEffect, useState } from 'react';
import { UserSettings } from '../types.ts';

interface BlueLightOverlayProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const BlueLightOverlay: React.FC<BlueLightOverlayProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [ambientLux, setAmbientLux] = useState<number | null>(null);
  const [isNightTime, setIsNightTime] = useState<boolean>(false);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(false);

  // Check local time (Night hours: after 19:00 or before 07:00)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsNightTime(hour >= 19 || hour < 7);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Ambient Light Sensor API check
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) {
      try {
        // @ts-expect-error AmbientLightSensor may not be in default TS lib
        const sensor = new window.AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setAmbientLux(sensor.illuminance);
          setSensorAvailable(true);
        });
        sensor.addEventListener('error', () => {
          setSensorAvailable(false);
        });
        sensor.start();
        return () => sensor.stop();
      } catch {
        setSensorAvailable(false);
      }
    }
  }, []);

  // Determine if filter should be visually active
  const isDarkRoom = ambientLux !== null && ambientLux < 40;
  const isFilterActive =
    settings.blueLightFilterEnabled &&
    (!settings.blueLightAutoMode || isNightTime || isDarkRoom);

  // Color values
  const getFilterColor = () => {
    switch (settings.blueLightWarmth) {
      case 'candle':
        return 'rgba(255, 130, 20, ';
      case 'twilight':
        return 'rgba(235, 110, 80, ';
      case 'amber':
      default:
        return 'rgba(255, 175, 50, ';
    }
  };

  // Convert intensity (10-90) to opacity (0.05 - 0.35)
  const opacity = (settings.blueLightIntensity / 100) * 0.32;
  const overlayStyle = isFilterActive
    ? {
        backgroundColor: `${getFilterColor()}${opacity})`,
        pointerEvents: 'none' as const,
        mixBlendMode: 'multiply' as const,
      }
    : { display: 'none' };

  return (
    <>
      {/* Full-screen eye relief tint overlay */}
      <div
        id="envision-blue-light-overlay"
        className="fixed inset-0 z-40 transition-all duration-700 pointer-events-none"
        style={overlayStyle}
        aria-hidden="true"
      />

      {/* Floating Mini Status Pill at bottom right */}
      <div
        id="envision-blue-light-status"
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md shadow-sm border transition-colors bg-white/85 dark:bg-stone-900/85 border-amber-300/40 text-stone-700 dark:text-stone-300"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isFilterActive ? 'bg-amber-500 animate-pulse' : 'bg-stone-300 dark:bg-stone-600'
          }`}
        />
        <span>
          {isFilterActive
            ? `Warm Eye Filter: ${settings.blueLightIntensity}% (${settings.blueLightWarmth})`
            : 'Warm Filter Off'}
        </span>
        <button
          id="toggle-filter-btn"
          onClick={() =>
            onUpdateSettings({ blueLightFilterEnabled: !settings.blueLightFilterEnabled })
          }
          className="ml-1 px-2 py-0.5 rounded text-[11px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition"
        >
          {settings.blueLightFilterEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </>
  );
};
