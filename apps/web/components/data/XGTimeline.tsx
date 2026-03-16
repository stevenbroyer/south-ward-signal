// @ts-nocheck
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


interface XGTimelineProps {
  data?: XGEvent[];
  goals?: Goal[];
  homeLabel?: string;
  awayLabel?: string;
  isNYRBHome?: boolean;
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
  data = [],
  goals = [],
  homeLabel = 'NYRB',
  awayLabel = 'PHI',
  isNYRBHome = true,
  className = '',
}: XGTimelineProps) {
  const homeColor = isNYRBHome ? '#ED1A3D' : '#6E6E7A';
  const awayColor = isNYRBHome ? '#6E6E7A' : '#ED1A3D';
  const homeBgClass = isNYRBHome ? 'bg-red' : 'bg-sws-400';
  const awayBgClass = isNYRBHome ? 'bg-sws-400' : 'bg-red';
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">xG Timeline</h3>
        <div className="h-[280px] flex items-center justify-center text-sws-500 text-sm font-mono">
          Per-minute xG data not available
        </div>
      </div>
    );
  }
  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">xG Timeline</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-[2px] ${homeBgClass} inline-block rounded`} />
            {homeLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-[2px] ${awayBgClass} inline-block rounded`} />
            {awayLabel}
          </span>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={homeColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={homeColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={awayColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={awayColor} stopOpacity={0} />
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
              stroke={homeColor}
              strokeWidth={2}
              fill="url(#homeGrad)"
            />
            <Area
              type="monotone"
              dataKey="awayXg"
              name={awayLabel}
              stroke={awayColor}
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
                  fill={goal.team === 'home' ? homeColor : awayColor}
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
              (goal.team === 'home') === isNYRBHome
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
