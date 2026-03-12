'use client';

import { motion } from 'motion/react';

interface SplitStats {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  avgXgFor: number;
  avgXgAgainst: number;
  avgPossession: number;
  cleanSheets: number;
}

interface HomeAwayComparisonProps {
  home?: SplitStats | null;
  away?: SplitStats | null;
  className?: string;
}

const STAT_ROWS = [
  { key: 'games', label: 'Games' },
  { key: 'wins', label: 'Wins' },
  { key: 'draws', label: 'Draws' },
  { key: 'losses', label: 'Losses' },
  { key: 'goalsFor', label: 'Goals For' },
  { key: 'goalsAgainst', label: 'Goals Against' },
  { key: 'avgXgFor', label: 'Avg xG', dec: 2 },
  { key: 'avgXgAgainst', label: 'Avg xGA', dec: 2 },
  { key: 'avgPossession', label: 'Avg Poss.', dec: 1, suffix: '%' },
  { key: 'cleanSheets', label: 'Clean Sheets' },
] as const;

export function HomeAwayComparison({ home, away, className = '' }: HomeAwayComparisonProps) {
  if (!home || !away) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Home vs Away</h3>
        <p className="text-sm font-mono text-sws-500">No data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <h3 className="font-display font-bold text-lg text-sws-white mb-4">Home vs Away</h3>

      <div className="space-y-2">
        {/* Header */}
        <div className="flex text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-2">
          <span className="flex-1 text-center">Home</span>
          <span className="w-28 text-center" />
          <span className="flex-1 text-center">Away</span>
        </div>

        {STAT_ROWS.map((stat, i) => {
          const hVal = (home as any)[stat.key] as number;
          const aVal = (away as any)[stat.key] as number;
          const format = (v: number) => {
            if ('dec' in stat && stat.dec) return v.toFixed(stat.dec);
            return String(v);
          };
          const hBetter = stat.key === 'goalsAgainst' || stat.key === 'avgXgAgainst' || stat.key === 'losses'
            ? hVal < aVal
            : hVal > aVal;

          return (
            <motion.div
              key={stat.key}
              className="flex items-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <span className={`flex-1 text-right font-mono text-sm pr-3 ${hBetter ? 'text-sws-white font-medium' : 'text-sws-400'}`}>
                {format(hVal)}{'suffix' in stat ? stat.suffix : ''}
              </span>
              <span className="w-28 text-center text-[10px] font-mono text-sws-500 uppercase">
                {stat.label}
              </span>
              <span className={`flex-1 text-left font-mono text-sm pl-3 ${!hBetter ? 'text-sws-white font-medium' : 'text-sws-400'}`}>
                {format(aVal)}{'suffix' in stat ? stat.suffix : ''}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
