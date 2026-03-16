'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface StatPair {
  label: string;
  home: number;
  away: number;
  format?: 'int' | 'pct' | 'dec';
}

interface StatComparisonBarsProps {
  stats?: StatPair[];
  homeTeam?: string;
  awayTeam?: string;
  isNYRBHome?: boolean;
  className?: string;
}

function formatValue(v: number, format: string = 'int'): string {
  if (format === 'pct') return `${v}%`;
  if (format === 'dec') return v.toFixed(1);
  return String(Math.round(v));
}

export function StatComparisonBars({
  stats = [],
  homeTeam = 'Home',
  awayTeam = 'Away',
  isNYRBHome = true,
  className = '',
}: StatComparisonBarsProps) {
  const nyrbBarColor = 'bg-red';
  const oppBarColor = 'bg-sws-400';
  const homeBarColor = isNYRBHome ? nyrbBarColor : oppBarColor;
  const awayBarColor = isNYRBHome ? oppBarColor : nyrbBarColor;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  if (!stats.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Match Stats</h3>
        <p className="text-sm font-mono text-sws-500">No stats available</p>
      </div>
    );
  }

  return (
    <div ref={ref} className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-medium ${isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>{homeTeam}</span>
        <h3 className="font-display font-bold text-lg text-sws-white">Match Stats</h3>
        <span className={`text-sm font-medium ${!isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>{awayTeam}</span>
      </div>

      <div className="space-y-4">
        {stats.map((stat, i) => {
          const total = (stat.home || 0) + (stat.away || 0) || 1;
          const homePct = ((stat.home || 0) / total) * 100;
          const awayPct = ((stat.away || 0) / total) * 100;
          const homeWins = stat.home > stat.away;

          return (
            <div key={stat.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={homeWins ? 'text-sws-white font-medium' : 'text-sws-400'}>
                  {formatValue(stat.home, stat.format)}
                </span>
                <span className="text-sws-500 uppercase tracking-wider text-[10px]">{stat.label}</span>
                <span className={!homeWins ? 'text-sws-white font-medium' : 'text-sws-400'}>
                  {formatValue(stat.away, stat.format)}
                </span>
              </div>
              <div className="flex gap-1 h-1.5">
                <div className="flex-1 bg-sws-700 rounded-full overflow-hidden flex justify-end">
                  <motion.div
                    className={`h-full ${homeBarColor} rounded-full`}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${homePct}%` } : { width: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="flex-1 bg-sws-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${awayBarColor} rounded-full`}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${awayPct}%` } : { width: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.06 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
