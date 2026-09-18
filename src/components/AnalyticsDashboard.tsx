import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Eye,
  Sparkles,
  Zap,
  Sliders,
  Bell,
  SunMedium,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  CorrelationDataResponse,
  EyeStrainLog,
  DailyChallenge,
  UserSettings,
} from '../types.ts';
import { backgroundNotification } from '../utils/backgroundNotification.ts';

interface AnalyticsDashboardProps {
  settings: UserSettings;
  challenges: DailyChallenge[];
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onStartExercise: (challenge: DailyChallenge) => void;
  onTriggerBreakNow: () => void;
  onTestBackgroundBreak: (seconds: number) => void;
  activeScreenSeconds: number;
}

const COMMON_SYMPTOMS = [
  { id: 'dryness', label: 'Dry / Gritty Eyes' },
  { id: 'blurred', label: 'Blurred Focus' },
  { id: 'headache', label: 'Temple Headache' },
  { id: 'light_sensitive', label: 'Light Sensitivity' },
  { id: 'heavy_lids', label: 'Heavy / Tired Eyelids' },
  { id: 'neck_strain', label: 'Neck & Shoulder Tension' },
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  settings,
  challenges,
  onUpdateSettings,
  onStartExercise,
  onTriggerBreakNow,
  onTestBackgroundBreak,
  activeScreenSeconds,
}) => {
  const [viewPeriod, setViewPeriod] = useState<'daily' | 'weekly'>('daily');
  const [data, setData] = useState<CorrelationDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Strain check-in form state
  const [strainScore, setStrainScore] = useState<number>(4);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['dryness']);
  const [checkInNote, setCheckInNote] = useState<string>('');
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Background mode testing feedback
  const [testActive, setTestActive] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/analytics/correlation');
      if (res.ok) {
        const json: CorrelationDataResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch correlation data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleToggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId]
    );
  };

  const handleSubmitStrainLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLog(true);
    setLogSuccessMessage(null);

    try {
      const res = await fetch('/api/analytics/log-strain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: strainScore,
          symptoms: selectedSymptoms,
          notes: checkInNote,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.correlation) {
          setData(json.correlation);
        }
        setLogSuccessMessage('Eye strain check-in logged! Correlation graph updated.');
        setCheckInNote('');
        setTimeout(() => setLogSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to submit eye strain log:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleRequestNotifications = async () => {
    const perm = await backgroundNotification.requestPermission();
    setNotificationPermission(perm);
  };

  const handleStartBackgroundTest = () => {
    setTestActive(true);
    handleRequestNotifications();
    onTestBackgroundBreak(5);
    setTimeout(() => setTestActive(false), 6000);
  };

  const getStrainDescriptor = (score: number) => {
    if (score <= 2.5) return { label: 'Optimal / Refreshed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    if (score <= 4.5) return { label: 'Mild Visual Fatigue', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    if (score <= 6.5) return { label: 'Moderate Eye Strain', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' };
    return { label: 'Severe Strain / Glare Pain', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isDaily = viewPeriod === 'daily';
      const screenTimeVal = payload.find((p: any) => p.dataKey === (isDaily ? 'screenMinutes' : 'screenHours'))?.value;
      const strainVal = payload.find((p: any) => p.dataKey === 'strainScore')?.value;
      const breaksVal = payload[0]?.payload?.breaksTaken ?? 0;

      const strainStatus = getStrainDescriptor(strainVal || 0);

      return (
        <div className="p-3 rounded-xl bg-stone-900 text-stone-100 shadow-xl border border-stone-800 text-xs min-w-[200px]">
          <p className="font-bold text-stone-300 mb-1 border-b border-stone-800 pb-1 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-[10px] font-mono text-stone-400">{isDaily ? 'Hourly Today' : 'Daily Record'}</span>
          </p>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                Screen Duration:
              </span>
              <span className="font-bold font-mono text-emerald-300">
                {isDaily ? `${screenTimeVal} mins` : `${screenTimeVal} hrs`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-400">
                <Eye className="w-3.5 h-3.5" />
                Eye Strain Index:
              </span>
              <span className="font-bold font-mono text-amber-300">{strainVal} / 10</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sky-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Breaks Completed:
              </span>
              <span className="font-bold font-mono text-sky-300">{breaksVal} breaks</span>
            </div>

            <div className="pt-1 mt-1 border-t border-stone-800 text-[11px] font-medium text-stone-300">
              Status: <span className={strainStatus.color}>{strainStatus.label}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-stone-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading eye strain correlation models...</span>
      </div>
    );
  }

  const currentDesc = getStrainDescriptor(data.correlationStats.currentTodayStrain);

  return (
    <div className="space-y-8">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                Screen Time & Eye Strain Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Ocular fatigue correlation model & evidence-based strain reduction recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily vs Weekly Toggle */}
          <div className="p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800 flex items-center gap-1 text-xs font-semibold">
            <button
              id="period-daily-btn"
              onClick={() => setViewPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewPeriod === 'daily'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Daily (Hourly Today)
            </button>
            <button
              id="period-weekly-btn"
              onClick={() => setViewPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewPeriod === 'weekly'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Weekly (7-Day Overview)
            </button>
          </div>

          <button
            id="refresh-analytics-btn"
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Background Mode Status & Control Hero Banner */}
      <div
        id="background-mode-banner"
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Background Break Engine
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {settings.backgroundModeEnabled ? 'Always Active' : 'Disabled'}
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                Runs even when working in other tabs, Google Docs, or coding IDEs
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                enVision utilizes a dedicated background worker to accurately track continuous screen exposure across all windows. When your 20-minute limit arrives, it issues native desktop notifications, a chime alert, and a flashing tab indicator so you never miss an eye-rest cycle.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="test-background-break-btn"
              onClick={handleStartBackgroundTest}
              disabled={testActive}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{testActive ? 'Countdown (5s)... Switch Tabs!' : 'Test Background Break (5s)'}</span>
            </button>

            <button
              id="toggle-background-mode-btn"
              onClick={() => onUpdateSettings({ backgroundModeEnabled: !settings.backgroundModeEnabled })}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                settings.backgroundModeEnabled
                  ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                  : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
              }`}
            >
              {settings.backgroundModeEnabled ? 'Turn Off Background' : 'Turn On Background'}
            </button>

            {notificationPermission !== 'granted' && (
              <button
                id="request-notif-perm-btn"
                onClick={handleRequestNotifications}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable System Notifications</span>
              </button>
            )}
          </div>
        </div>

        {testActive && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>
              <strong>Testing in progress:</strong> Switch to another tab or minimize this window right now to see the desktop notification and hear the break chime trigger in 5 seconds!
            </span>
          </div>
        )}
      </div>

      {/* 3. High-Contrast Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pearson Correlation */}
        <div
          id="metric-pearson"
          className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Screen-to-Strain Correlation
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400 font-mono">
                +{data.correlationStats.pearsonR}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {data.correlationStats.correlationLabel}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 border-t border-stone-100 dark:border-stone-800 pt-2">
            Higher unbroken screen exposure directly intensifies ocular muscular tension.
          </p>
        </div>

        {/* Card 2: Break Protection Shield */}
        <div
          id="metric-break-shield"
          className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Break Mitigation Shield
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black tracking-tight text-sky-600 dark:text-sky-400 font-mono">
                -{data.correlationStats.strainReductionPercent}%
              </span>
              <span className="text-xs font-bold text-emerald-600">Strain Reduction</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 border-t border-stone-100 dark:border-stone-800 pt-2">
            Average ocular strain drops 42% on days when at least 5 breaks are completed.
          </p>
        </div>

        {/* Card 3: Critical Strain Duration Threshold */}
        <div
          id="metric-duration-threshold"
          className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Critical Strain Threshold
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-mono">
                {data.correlationStats.criticalThresholdHours}h
              </span>
              <span className="text-xs font-bold text-rose-500">Fatigue Point</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 border-t border-stone-100 dark:border-stone-800 pt-2">
            Peak strain window: <strong>{data.correlationStats.peakStrainTime}</strong> after continuous focal accommodation.
          </p>
        </div>

        {/* Card 4: Current Eye Strain Status */}
        <div
          id="metric-current-strain"
          className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Current Eye Strain Level
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-mono">
                {data.correlationStats.currentTodayStrain}
                <span className="text-lg text-stone-400 font-normal">/10</span>
              </span>
              <span className={`text-xs font-bold ${currentDesc.color}`}>{currentDesc.label}</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 border-t border-stone-100 dark:border-stone-800 pt-2">
            Calculated from active screen time ({Math.round(activeScreenSeconds / 60)}m) and verified break frequency.
          </p>
        </div>
      </div>

      {/* 4. Dual-Axis Screen Time vs Eye Strain Graph */}
      <div
        id="correlation-chart-card"
        className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {viewPeriod === 'daily'
                  ? "Today's Hourly Screen Exposure vs. Eye Strain Score"
                  : 'Weekly Screen Hours vs. Eye Strain Score (7-Day Overview)'}
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Green bars represent screen exposure (left axis). The amber/coral line illustrates subjective eye fatigue (right axis, 1-10).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              Screen Time
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-3 h-0.5 bg-amber-500" />
              Eye Strain Index
            </span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={viewPeriod === 'daily' ? (data.dailyHourly as any[]) : (data.weekly as any[])}
              margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />

              <XAxis
                dataKey={viewPeriod === 'daily' ? 'hour' : 'day'}
                tick={{ fill: '#78716c', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
              />

              {/* Left Y Axis for Screen Time */}
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: '#059669', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit={viewPeriod === 'daily' ? 'm' : 'h'}
              />

              {/* Right Y Axis for Eye Strain (1 to 10 scale) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fill: '#d97706', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Moderate Strain Reference Line */}
              <ReferenceLine
                yAxisId="right"
                y={5}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: 'Moderate Strain Threshold',
                  position: 'insideTopRight',
                  fill: '#d97706',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              <Bar
                yAxisId="left"
                dataKey={viewPeriod === 'daily' ? 'screenMinutes' : 'screenHours'}
                name="Screen Exposure"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="strainScore"
                name="Eye Strain"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#d97706', strokeWidth: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>Notice: Noticeable strain drop occurs directly following hours where 20-20-20 breaks are taken.</span>
          </div>
          <span className="font-semibold text-stone-600 dark:text-stone-300">
            Total recorded break sessions: {data.correlationStats.totalBreakProtectionCount}
          </span>
        </div>
      </div>

      {/* 5. Evidence-Based Recommendations to Reduce Eye Strain */}
      <div
        id="recommendations-section"
        className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Evidence-Based Eye Strain Recommendations
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Personalized Protocol
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Specific, actionable interventions matched directly to your detected screen time and ocular fatigue patterns.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations.map((rec) => (
            <div
              key={rec.id}
              id={`rec-card-${rec.id}`}
              className="p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{rec.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      rec.priority === 'high'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : rec.priority === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">{rec.insight}</p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-stone-400 uppercase font-semibold">
                  {rec.category}
                </span>

                {rec.actionType === 'set_interval_15' && (
                  <button
                    id="rec-set-15m-btn"
                    onClick={() => onUpdateSettings({ breakIntervalMinutes: 15 })}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    {settings.breakIntervalMinutes === 15 ? 'Interval Set to 15m' : rec.actionText}
                  </button>
                )}

                {rec.actionType === 'toggle_blue_light' && (
                  <button
                    id="rec-toggle-bluelight-btn"
                    onClick={() =>
                      onUpdateSettings({ blueLightFilterEnabled: !settings.blueLightFilterEnabled })
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    {settings.blueLightFilterEnabled ? 'Filter On (Warm)' : rec.actionText}
                  </button>
                )}

                {rec.actionType === 'start_challenge' && (
                  <button
                    id={`rec-start-challenge-${rec.id}`}
                    onClick={() => {
                      const challengeToStart =
                        challenges.find((c) => c.id === rec.actionPayload) || challenges[0];
                      if (challengeToStart) {
                        onStartExercise(challengeToStart);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{rec.actionText}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Interactive Eye Strain Check-In Logger */}
      <div
        id="strain-checkin-section"
        className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              Log Your Eye Strain Check-In
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Help enVision refine your personal correlation index by rating your real-time ocular comfort.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitStrainLog} className="space-y-4">
          {/* Score Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="strain-slider" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Eye Strain Rating (1 = Fully Refreshed, 10 = Severe Burning/Headache)
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentDesc.bg} ${currentDesc.color}`}>
                Score: {strainScore} / 10 — {getStrainDescriptor(strainScore).label}
              </span>
            </div>

            <input
              id="strain-slider"
              type="range"
              min="1"
              max="10"
              step="1"
              value={strainScore}
              onChange={(e) => setStrainScore(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-stone-200 dark:bg-stone-800 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
              <span>1: Refreshed</span>
              <span>3: Mild</span>
              <span>5: Moderate</span>
              <span>7: High Strain</span>
              <span>10: Severe Pain</span>
            </div>
          </div>

          {/* Symptom Selection Chips */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
              Current Eye Symptoms (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => handleToggleSymptom(sym.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-950/40 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    {sym.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <label htmlFor="strain-note-input" className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Optional Context / Task (e.g. &ldquo;2 hours of code review in dark room&rdquo;)
            </label>
            <input
              id="strain-note-input"
              type="text"
              value={checkInNote}
              onChange={(e) => setCheckInNote(e.target.value)}
              placeholder="e.g. Late night spreadsheet work with slight glare..."
              className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button & Feedback */}
          <div className="flex items-center gap-3 pt-1">
            <button
              id="submit-strain-log-btn"
              type="submit"
              disabled={isSubmittingLog}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              {isSubmittingLog ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging check-in...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Eye Strain Check-In</span>
                </>
              )}
            </button>

            {logSuccessMessage && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {logSuccessMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
