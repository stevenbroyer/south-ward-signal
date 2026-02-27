'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface PlayerData {
  name: string;
  stats: Record<string, number>;
}

const COMPARE_STATS = [
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
  { key: 'xg', label: 'xG' },
  { key: 'xa', label: 'xA' },
  { key: 'goals_added', label: 'G+' },
  { key: 'key_passes', label: 'Key Pass' },
  { key: 'pass_completion', label: 'Pass%' },
];

const COLORS = ['#ED1A3D', '#22C55E', '#D4A843', '#6E6E7A'];

interface PlayerComparisonRadarProps {
  players?: PlayerData[];
  className?: string;
}

export function PlayerComparisonRadar({ players = [], className = '' }: PlayerComparisonRadarProps) {
  if (players.length < 2) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Player Comparison</h3>
        <p className="text-sm font-mono text-sws-500">Select at least 2 players to compare</p>
      </div>
    );
  }

  // Normalize stats to 0-100 percentiles within the comparison group
  const radarData = COMPARE_STATS.map((stat) => {
    const values = players.map((p) => Number(p.stats[stat.key]) || 0);
    const max = Math.max(...values, 0.01);

    const point: Record<string, any> = { stat: stat.label };
    players.forEach((p, i) => {
      point[p.name] = Math.round(((Number(p.stats[stat.key]) || 0) / max) * 100);
    });
    return point;
  });

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Player Comparison</h3>
        <div className="flex items-center gap-4 mt-2 text-xs font-mono text-sws-500">
          {players.map((p, i) => (
            <span key={p.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i] }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#2A2A32" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: '#6E6E7A', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            {players.map((p, i) => (
              <Radar
                key={p.name}
                name={p.name}
                dataKey={p.name}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181C',
                border: '1px solid #2A2A32',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-jetbrains)',
              }}
              itemStyle={{ color: '#F5F5F7' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
