'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrajectoryPoint {
  matchweek: number;
  points: number;
  playoffPace: number;
  shieldPace: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-2">Matchweek {d.matchweek}</p>
      <p className="text-xs font-mono text-red">Points: {d.points}</p>
      <p className="text-xs font-mono text-success/70">Playoff Pace: {d.playoffPace}</p>
      <p className="text-xs font-mono text-gold/70">Shield Pace: {d.shieldPace}</p>
    </div>
  );
}

interface PointsTrajectoryChartProps {
  data?: TrajectoryPoint[];
  className?: string;
}

export function PointsTrajectoryChart({ data = [], className = '' }: PointsTrajectoryChartProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Points Trajectory</h3>
        <div className="h-[280px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Points Trajectory</h3>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-red inline-block rounded" />
            NYRB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-success/50 inline-block rounded" />
            Playoff
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] bg-gold/50 inline-block rounded" />
            Shield
          </span>
        </div>
      </div>

      <div className="h-[280px]">
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
              dataKey="shieldPace"
              stroke="#D4A843"
              strokeWidth={1}
              strokeDasharray="6 4"
              strokeOpacity={0.4}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="playoffPace"
              stroke="#22C55E"
              strokeWidth={1}
              strokeDasharray="6 4"
              strokeOpacity={0.4}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="points"
              stroke="#ED1A3D"
              strokeWidth={2.5}
              dot={{ fill: '#ED1A3D', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#ED1A3D', stroke: '#0A0A0C', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
