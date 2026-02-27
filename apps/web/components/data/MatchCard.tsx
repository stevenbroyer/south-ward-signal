'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface MatchCardProps {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  homeXg?: number;
  awayXg?: number;
  status: string;
  venue?: string;
  index?: number;
}

export function MatchCard({
  id,
  date,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeXg,
  awayXg,
  status,
  venue,
  index = 0,
}: MatchCardProps) {
  const isNYRBHome = homeTeam.includes('Red Bulls');
  const isFinished = status === 'finished';
  const nybScore = isNYRBHome ? homeScore : awayScore;
  const oppScore = isNYRBHome ? awayScore : homeScore;
  const result = !isFinished ? null
    : (nybScore ?? 0) > (oppScore ?? 0) ? 'W'
    : (nybScore ?? 0) < (oppScore ?? 0) ? 'L'
    : 'D';

  const resultColor = result === 'W' ? 'border-success/30' : result === 'L' ? 'border-red/30' : result === 'D' ? 'border-gold/30' : 'border-sws-700/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        href={`/data-room/matches/${id}`}
        className={`block bg-bg-card border ${resultColor} rounded-xl p-4 hover:bg-bg-elevated transition-colors group`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-sws-500 uppercase tracking-wider">
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {result && (
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              result === 'W' ? 'bg-success/10 text-success' :
              result === 'L' ? 'bg-red/10 text-red' :
              'bg-gold/10 text-gold'
            }`}>
              {result}
            </span>
          )}
          {!isFinished && (
            <span className="text-[10px] font-mono text-sws-500 uppercase">
              {status === 'live' ? '● LIVE' : new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>
              {homeTeam}
            </p>
            <p className={`text-sm font-medium truncate ${!isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>
              {awayTeam}
            </p>
          </div>

          {isFinished && (
            <div className="text-right ml-4">
              <p className={`text-lg font-mono font-bold ${isNYRBHome ? 'text-sws-white' : 'text-sws-300'}`}>
                {homeScore}
              </p>
              <p className={`text-lg font-mono font-bold ${!isNYRBHome ? 'text-sws-white' : 'text-sws-300'}`}>
                {awayScore}
              </p>
            </div>
          )}
        </div>

        {isFinished && homeXg != null && awayXg != null && (
          <div className="flex gap-4 mt-2 text-[10px] font-mono text-sws-500">
            <span>xG: {Number(homeXg).toFixed(1)} - {Number(awayXg).toFixed(1)}</span>
            {venue && <span className="truncate">{venue}</span>}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
