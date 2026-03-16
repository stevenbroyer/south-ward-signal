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
  ReferenceLine,
} from 'recharts';

interface MomentumPoint {
  minute: number;
  value: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const side = d.value > 0 ? 'Home' : d.value < 0 ? 'Away' : 'Neutral';
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500">{d.minute}&apos;</p>
      <p className="text-xs font-mono text-sws-300">{side} momentum</p>
    </div>
  );
}

interface MomentumChartProps {
  data?: MomentumPoint[];
  homeTeam?: string;
  awayTeam?: string;
  isNYRBHome?: boolean;
  className?: string;
}

export function MomentumChart({
  data = [],
  homeTeam = 'Home',
  awayTeam = 'Away',
  isNYRBHome = true,
  className = '',
}: MomentumChartProps) {
  const homeColor = isNYRBHome ? '#ED1A3D' : '#6E6E7A';
  const awayColor = isNYRBHome ? '#6E6E7A' : '#ED1A3D';
  const homeBgClass = isNYRBHome ? 'bg-red' : 'bg-sws-400';
  const awayBgClass = isNYRBHome ? 'bg-sws-400' : 'bg-red';
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Momentum</h3>
        <div className="h-[200px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  const splitData = data.map((d) => ({
    minute: d.minute,
    home: d.value > 0 ? d.value : 0,
    away: d.value < 0 ? d.value : 0,
    value: d.value,
  }));

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Momentum</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${homeBgClass} inline-block`} />
            {homeTeam}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${awayBgClass} inline-block`} />
            {awayTeam}
          </span>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={splitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="momHomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={homeColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={homeColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="momAwayGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={awayColor} stopOpacity={0.3} />
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
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#2A2A32" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="home"
              stroke={homeColor}
              strokeWidth={1.5}
              fill="url(#momHomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="away"
              stroke={awayColor}
              strokeWidth={1.5}
              fill="url(#momAwayGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
