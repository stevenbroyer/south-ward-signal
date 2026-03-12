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
} from 'recharts';

interface MarketValueEntry {
  date: string;
  value: number; // in EUR
  team?: string;
}

interface MarketValueChartProps {
  playerName?: string;
  data?: MarketValueEntry[];
  className?: string;
}

function formatValue(val: number): string {
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}m`;
  if (val >= 1_000) return `€${(val / 1_000).toFixed(0)}k`;
  return `€${val}`;
}

function MarketValueTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-1">
        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </p>
      <p className="text-sm font-mono font-bold text-red">{formatValue(d.value)}</p>
      {d.team && <p className="text-[10px] font-mono text-sws-400 mt-1">{d.team}</p>}
    </div>
  );
}

const SAMPLE_DATA: MarketValueEntry[] = [
  { date: '2022-06-01', value: 500_000, team: 'New York Red Bulls' },
  { date: '2022-12-01', value: 750_000, team: 'New York Red Bulls' },
  { date: '2023-06-01', value: 1_200_000, team: 'New York Red Bulls' },
  { date: '2023-12-01', value: 1_800_000, team: 'New York Red Bulls' },
  { date: '2024-06-01', value: 2_500_000, team: 'New York Red Bulls' },
  { date: '2024-12-01', value: 3_000_000, team: 'New York Red Bulls' },
  { date: '2025-06-01', value: 3_500_000, team: 'New York Red Bulls' },
];

export function MarketValueChart({
  playerName = 'Lewis Morgan',
  data = SAMPLE_DATA,
  className = '',
}: MarketValueChartProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-2">Market Value</h3>
        <p className="text-sm font-mono text-sws-500">No market value data available</p>
      </div>
    );
  }

  const currentValue = data[data.length - 1]?.value || 0;
  const peakValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-sws-white">Market Value</h3>
          <p className="text-xs font-mono text-sws-500 mt-1">{playerName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold text-red">{formatValue(currentValue)}</p>
          <p className="text-[10px] font-mono text-sws-500">Peak: {formatValue(peakValue)}</p>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="marketValueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ED1A3D" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ED1A3D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={{ stroke: '#2A2A32' }}
              tickLine={false}
              tickFormatter={(val) => {
                const d = new Date(val);
                return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => formatValue(val)}
            />
            <Tooltip content={<MarketValueTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ED1A3D"
              strokeWidth={2}
              fill="url(#marketValueGradient)"
              dot={{ fill: '#ED1A3D', r: 2, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
