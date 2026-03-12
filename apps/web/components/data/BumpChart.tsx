// @ts-nocheck
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

interface StandingsWeek {
  week: number;
  team: string;
  position: number;
  points: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl max-w-xs">
      <p className="text-[10px] font-mono text-sws-500 mb-2">Week {payload[0]?.payload?.week}</p>
      {payload
        .sort((a: any, b: any) => a.value - b.value)
        .map((entry: any) => (
          <p key={entry.name} className="text-xs font-mono" style={{ color: entry.color }}>
            #{entry.value} {entry.name}
          </p>
        ))}
    </div>
  );
}

interface BumpChartProps {
  data?: StandingsWeek[];
  highlightTeam?: string;
  className?: string;
}

export function BumpChart({ data = [], highlightTeam = 'New York Red Bulls', className = '' }: BumpChartProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Standings Movement</h3>
        <div className="h-[350px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  // Pivot data: each week row has team -> position
  const weeks = [...new Set(data.map((d) => d.week))].sort((a, b) => a - b);
  const teams = [...new Set(data.map((d) => d.team))];

  const chartData = weeks.map((week) => {
    const row: Record<string, any> = { week };
    const weekData = data.filter((d) => d.week === week);
    for (const entry of weekData) {
      row[entry.team] = entry.position;
    }
    return row;
  });

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Standings Movement</h3>
        <span className="text-xs font-mono text-sws-500">Position over time (lower = better)</span>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={{ stroke: '#2A2A32' }}
              tickLine={false}
              tickFormatter={(v) => `W${v}`}
            />
            <YAxis
              reversed
              domain={[1, Math.max(...data.map((d) => d.position), 15)]}
              tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {teams.map((team) => {
              const isHighlighted = team === highlightTeam;
              return (
                <Line
                  key={team}
                  type="monotone"
                  dataKey={team}
                  stroke={isHighlighted ? '#ED1A3D' : '#2A2A32'}
                  strokeWidth={isHighlighted ? 3 : 1}
                  strokeOpacity={isHighlighted ? 1 : 0.4}
                  dot={isHighlighted ? { fill: '#ED1A3D', r: 3, strokeWidth: 0 } : false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
