// @ts-nocheck
'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface GKMetric {
  stat: string;
  value: number;
  average: number;
}

interface GoalkeeperRadarProps {
  playerName?: string;
  metrics?: GKMetric[];
  className?: string;
}

const SAMPLE_METRICS: GKMetric[] = [
  { stat: 'Save %', value: 74, average: 68 },
  { stat: 'xG Prevented', value: 65, average: 50 },
  { stat: 'GSAA', value: 72, average: 50 },
  { stat: 'Crosses Claimed', value: 58, average: 55 },
  { stat: 'Distribution', value: 61, average: 50 },
  { stat: 'Sweeping', value: 45, average: 48 },
];

export function GoalkeeperRadar({
  playerName = 'Carlos Coronel',
  metrics = SAMPLE_METRICS,
  className = '',
}: GoalkeeperRadarProps) {
  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">GK Analytics</h3>
        <div className="flex items-center gap-4 text-xs font-mono text-sws-500 mt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red inline-block" />
            {playerName}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sws-500 inline-block" />
            MLS Average
          </span>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={metrics} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#2A2A32" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: '#6E6E7A', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="MLS Avg"
              dataKey="average"
              stroke="#44444F"
              fill="#44444F"
              fillOpacity={0.15}
              strokeWidth={1}
            />
            <Radar
              name={playerName}
              dataKey="value"
              stroke="#ED1A3D"
              fill="#ED1A3D"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181C',
                border: '1px solid #2A2A32',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-jetbrains)',
              }}
              itemStyle={{ color: '#F5F5F7' }}
              labelStyle={{ color: '#6E6E7A', fontSize: '10px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
