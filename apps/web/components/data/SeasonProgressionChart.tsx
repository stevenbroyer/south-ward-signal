'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProgressionPoint {
  matchweek: number;
  goals: number;
  xg: number;
  assists?: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-2">Match {d.matchweek}</p>
      <p className="text-xs font-mono text-sws-white">Goals: {d.goals}</p>
      <p className="text-xs font-mono text-red">xG: {d.xg.toFixed(2)}</p>
      {d.assists != null && <p className="text-xs font-mono text-sws-400">Assists: {d.assists}</p>}
    </div>
  );
}

interface SeasonProgressionChartProps {
  data?: ProgressionPoint[];
  className?: string;
}

export function SeasonProgressionChart({ data = [], className = '' }: SeasonProgressionChartProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Season Progression</h3>
        <div className="h-[260px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Season Progression</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-sws-white inline-block rounded" />
            Goals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-red inline-block rounded" />
            xG
          </span>
        </div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
            <XAxis
              dataKey="matchweek"
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={{ stroke: '#2A2A32' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="xg"
              stroke="#ED1A3D"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
            <Line
              type="stepAfter"
              dataKey="goals"
              stroke="#F5F5F7"
              strokeWidth={2}
              dot={{ fill: '#F5F5F7', r: 3, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
