'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface XGEvent {
  minute: number;
  homeXg: number;
  awayXg: number;
}

interface Goal {
  minute: number;
  team: 'home' | 'away';
  player: string;
}

const SAMPLE_DATA: XGEvent[] = [
  { minute: 0, homeXg: 0, awayXg: 0 },
  { minute: 5, homeXg: 0.08, awayXg: 0.02 },
  { minute: 12, homeXg: 0.22, awayXg: 0.05 },
  { minute: 18, homeXg: 0.35, awayXg: 0.12 },
  { minute: 23, homeXg: 0.72, awayXg: 0.15 },
  { minute: 30, homeXg: 0.85, awayXg: 0.28 },
  { minute: 35, homeXg: 0.92, awayXg: 0.42 },
  { minute: 40, homeXg: 1.05, awayXg: 0.48 },
  { minute: 45, homeXg: 1.12, awayXg: 0.55 },
  { minute: 50, homeXg: 1.18, awayXg: 0.62 },
  { minute: 55, homeXg: 1.25, awayXg: 0.68 },
  { minute: 60, homeXg: 1.38, awayXg: 0.72 },
  { minute: 65, homeXg: 1.45, awayXg: 0.78 },
  { minute: 70, homeXg: 1.52, awayXg: 0.82 },
  { minute: 75, homeXg: 1.65, awayXg: 0.85 },
  { minute: 80, homeXg: 1.72, awayXg: 0.88 },
  { minute: 85, homeXg: 1.78, awayXg: 0.92 },
  { minute: 90, homeXg: 1.82, awayXg: 0.95 },
];

const SAMPLE_GOALS: Goal[] = [
  { minute: 23, team: 'home', player: 'Vanzeir' },
  { minute: 35, team: 'away', player: 'Gazdag' },
  { minute: 75, team: 'home', player: 'Morgan' },
];

interface XGTimelineProps {
  data?: XGEvent[];
  goals?: Goal[];
  homeLabel?: string;
  awayLabel?: string;
  className?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-2">{label}&apos;</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-mono" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export function XGTimeline({
  data = SAMPLE_DATA,
  goals = SAMPLE_GOALS,
  homeLabel = 'NYRB',
  awayLabel = 'PHI',
  className = '',
}: XGTimelineProps) {
  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">xG Timeline</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-red inline-block rounded" />
            {homeLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-sws-400 inline-block rounded" />
            {awayLabel}
          </span>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ED1A3D" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ED1A3D" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6E6E7A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6E6E7A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
            <XAxis
              dataKey="minute"
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={{ stroke: '#2A2A32' }}
              tickLine={false}
              tickFormatter={(v) => `${v}'`}
            />
            <YAxis
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="homeXg"
              name={homeLabel}
              stroke="#ED1A3D"
              strokeWidth={2}
              fill="url(#homeGrad)"
            />
            <Area
              type="monotone"
              dataKey="awayXg"
              name={awayLabel}
              stroke="#6E6E7A"
              strokeWidth={1.5}
              fill="url(#awayGrad)"
            />
            {/* Goal markers */}
            {goals.map((goal, i) => {
              const point = data.find((d) => d.minute === goal.minute);
              if (!point) return null;
              return (
                <ReferenceDot
                  key={i}
                  x={goal.minute}
                  y={goal.team === 'home' ? point.homeXg : point.awayXg}
                  r={5}
                  fill={goal.team === 'home' ? '#ED1A3D' : '#6E6E7A'}
                  stroke="#0A0A0C"
                  strokeWidth={2}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Goal log */}
      <div className="mt-4 flex flex-wrap gap-3">
        {goals.map((goal, i) => (
          <span
            key={i}
            className={`text-[11px] font-mono px-2 py-1 rounded ${
              goal.team === 'home'
                ? 'bg-red/10 text-red border border-red/20'
                : 'bg-sws-700 text-sws-300 border border-sws-600'
            }`}
          >
            {goal.player} {goal.minute}&apos;
          </span>
        ))}
      </div>
    </div>
  );
}
