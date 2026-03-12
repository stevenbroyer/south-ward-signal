'use client';

import { motion } from 'motion/react';

interface GoalsAddedData {
  ga_dribbling: number | null;
  ga_passing: number | null;
  ga_receiving: number | null;
  ga_shooting: number | null;
  ga_defending: number | null;
  goals_added: number | null;
}

const ACTIONS = [
  { key: 'ga_shooting', label: 'Shooting', color: '#ED1A3D' },
  { key: 'ga_passing', label: 'Passing', color: '#FF4D6A' },
  { key: 'ga_receiving', label: 'Receiving', color: '#D4A843' },
  { key: 'ga_dribbling', label: 'Dribbling', color: '#22C55E' },
  { key: 'ga_defending', label: 'Defending', color: '#6E6E7A' },
] as const;

interface GoalsAddedBreakdownProps {
  data?: GoalsAddedData | null;
  className?: string;
}

export function GoalsAddedBreakdown({ data, className = '' }: GoalsAddedBreakdownProps) {
  if (!data) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Goals Added Breakdown</h3>
        <p className="text-sm font-mono text-sws-500">No data available</p>
      </div>
    );
  }

  const maxAbs = Math.max(
    ...ACTIONS.map((a) => Math.abs(Number((data as any)[a.key]) || 0)),
    0.1
  );

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Goals Added Breakdown</h3>
        <span className={`text-sm font-mono font-bold ${
          Number(data.goals_added) > 0 ? 'text-success' : 'text-red'
        }`}>
          {Number(data.goals_added) > 0 ? '+' : ''}{Number(data.goals_added).toFixed(2)} G+
        </span>
      </div>

      <div className="space-y-3">
        {ACTIONS.map((action, i) => {
          const val = Number((data as any)[action.key]) || 0;
          const width = (Math.abs(val) / maxAbs) * 100;
          const isPositive = val >= 0;

          return (
            <div key={action.key} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-sws-400">{action.label}</span>
                <span className={isPositive ? 'text-success' : 'text-red'}>
                  {isPositive ? '+' : ''}{val.toFixed(3)}
                </span>
              </div>
              <div className="h-2 bg-sws-700/30 rounded-full overflow-hidden flex items-center">
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: action.color, opacity: 0.6 }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${width}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                    />
                  )}
                </div>
                <div className="w-px h-full bg-sws-500" />
                <div className="w-1/2">
                  {isPositive && (
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: action.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${width}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
