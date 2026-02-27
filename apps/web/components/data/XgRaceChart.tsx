'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface XgRacePoint {
  matchweek: number;
  xgFor: number;
  xgAgainst: number;
  opponent?: string;
  result?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-2">
        MW {d.matchweek}{d.opponent ? ` — vs ${d.opponent}` : ''}
        {d.result ? ` (${d.result})` : ''}
      </p>
      <p className="text-xs font-mono text-red">xG For: {d.xgFor}</p>
      <p className="text-xs font-mono text-sws-400">xG Against: {d.xgAgainst}</p>
    </div>
  );
}

interface XgRaceChartProps {
  data?: XgRacePoint[];
  className?: string;
}

export function XgRaceChart({ data = [], className = '' }: XgRaceChartProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">xG Race</h3>
        <div className="h-[280px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">xG Race</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-red inline-block rounded" />
            xG For
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-sws-400 inline-block rounded" />
            xG Against
          </span>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="xgForGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ED1A3D" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ED1A3D" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="xgAgainstGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6E6E7A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6E6E7A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
            <XAxis
              dataKey="matchweek"
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={{ stroke: '#2A2A32' }}
              tickLine={false}
              tickFormatter={(v) => `MW${v}`}
            />
            <YAxis
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="xgFor"
              stroke="#ED1A3D"
              strokeWidth={2}
              fill="url(#xgForGrad)"
            />
            <Area
              type="monotone"
              dataKey="xgAgainst"
              stroke="#6E6E7A"
              strokeWidth={1.5}
              fill="url(#xgAgainstGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
