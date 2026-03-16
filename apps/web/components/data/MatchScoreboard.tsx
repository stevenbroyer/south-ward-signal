'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { displayName } from '@/lib/team-utils';

interface MatchScoreboardProps {
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  date?: string;
  venue?: string;
  possession?: [number, number];
  shots?: [number, number];
  xg?: [number, number];
  isNYRBHome?: boolean;
  className?: string;
}

function StatBar({ label, home, away, homeBarColor = 'bg-red', awayBarColor = 'bg-sws-400' }: { label: string; home: number; away: number; homeBarColor?: string; awayBarColor?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const total = (home || 0) + (away || 0) || 1;

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-sws-white">{typeof home === 'number' && home % 1 !== 0 ? home.toFixed(2) : home}</span>
        <span className="text-sws-500 uppercase tracking-wider">{label}</span>
        <span className="text-sws-300">{typeof away === 'number' && away % 1 !== 0 ? away.toFixed(2) : away}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-sws-700 rounded-full overflow-hidden flex justify-end">
          <motion.div
            className={`h-full ${homeBarColor} rounded-full`}
            initial={{ width: 0 }}
            animate={inView ? { width: `${(home / total) * 100}%` } : { width: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex-1 bg-sws-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${awayBarColor} rounded-full`}
            initial={{ width: 0 }}
            animate={inView ? { width: `${(away / total) * 100}%` } : { width: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

export function MatchScoreboard({
  homeTeam = 'RBNY',
  awayTeam = 'Philadelphia Union',
  homeScore = 2,
  awayScore = 1,
  date = '2026-02-22T19:30:00Z',
  venue = 'Red Bull Arena',
  possession = [58, 42],
  shots = [14, 9],
  xg = [1.82, 0.95],
  isNYRBHome = true,
  className = '',
}: MatchScoreboardProps) {
  const nybScore = isNYRBHome ? homeScore : awayScore;
  const oppScore = isNYRBHome ? awayScore : homeScore;
  const nybWon = (nybScore ?? 0) > (oppScore ?? 0);

  return (
    <motion.div
      className={`bg-bg-card border border-sws-700/50 rounded-xl p-6 ${nybWon ? 'glow-red' : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-1">
          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[10px] font-mono text-sws-600">{venue}</p>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="text-right flex-1">
          <p className={`font-display font-bold text-sm md:text-base ${isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>{displayName(homeTeam)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-4xl md:text-5xl font-mono font-bold ${isNYRBHome ? 'text-sws-white' : 'text-sws-300'}`}>{homeScore}</span>
          <span className="text-lg font-mono text-sws-600">-</span>
          <span className={`text-4xl md:text-5xl font-mono font-bold ${!isNYRBHome ? 'text-sws-white' : 'text-sws-300'}`}>{awayScore}</span>
        </div>
        <div className="text-left flex-1">
          <p className={`font-display font-bold text-sm md:text-base ${!isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>{displayName(awayTeam)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <StatBar label="Possession" home={possession[0]} away={possession[1]} homeBarColor={isNYRBHome ? 'bg-red' : 'bg-sws-400'} awayBarColor={isNYRBHome ? 'bg-sws-400' : 'bg-red'} />
        <StatBar label="Shots" home={shots[0]} away={shots[1]} homeBarColor={isNYRBHome ? 'bg-red' : 'bg-sws-400'} awayBarColor={isNYRBHome ? 'bg-sws-400' : 'bg-red'} />
        <StatBar label="xG" home={xg[0]} away={xg[1]} homeBarColor={isNYRBHome ? 'bg-red' : 'bg-sws-400'} awayBarColor={isNYRBHome ? 'bg-sws-400' : 'bg-red'} />
      </div>
    </motion.div>
  );
}
