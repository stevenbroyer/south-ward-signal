'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface MatchDataProp {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  home_xg: number | null;
  away_xg: number | null;
  date: string;
  venue: string | null;
  stats: Record<string, unknown>;
}

interface StandingProp {
  team: string;
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goal_difference: number;
  form: string[];
}

interface DataRoomPreviewProps {
  matchData?: MatchDataProp | null;
  standingsData?: StandingProp[] | null;
}

function StatBar({ home, away, label, type }: { home: number; away: number; label: string; type: 'pct' | 'dec' | 'int' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const total = home + away;
  const homeWidth = (home / total) * 100;

  const fmt = (v: number) => type === 'dec' ? v.toFixed(2) : type === 'pct' ? `${v}%` : v.toString();

  return (
    <div ref={ref} className="py-2">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-mono text-sws-white">{fmt(home)}</span>
        <span className="text-sws-400">{label}</span>
        <span className="font-mono text-sws-300">{fmt(away)}</span>
      </div>
      <div className="flex h-1 gap-0.5 rounded-full overflow-hidden">
        <motion.div
          className="bg-red rounded-l-full"
          initial={{ width: '50%' }}
          animate={isInView ? { width: `${homeWidth}%` } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="bg-sws-500 rounded-r-full"
          initial={{ width: '50%' }}
          animate={isInView ? { width: `${100 - homeWidth}%` } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function FormDot({ result }: { result: string }) {
  const colors: Record<string, string> = { W: 'bg-success', D: 'bg-warning', L: 'bg-red' };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[result] || 'bg-sws-500'}`} title={result} />
  );
}

export function DataRoomPreview({ matchData, standingsData }: DataRoomPreviewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const match = matchData;
  const standings = standingsData?.slice(0, 6) || [];

  // Derive stat bars from match data
  const stats: { label: string; home: number; away: number; type: 'pct' | 'dec' | 'int' }[] = match
    ? [
        { label: 'Possession', home: (match.stats as Record<string, Record<string, number>>)?.possession?.home ?? 50, away: (match.stats as Record<string, Record<string, number>>)?.possession?.away ?? 50, type: 'pct' },
        { label: 'xG', home: Number(match.home_xg) || 0, away: Number(match.away_xg) || 0, type: 'dec' },
        { label: 'Shots', home: (match.stats as Record<string, Record<string, number>>)?.shots?.home ?? 0, away: (match.stats as Record<string, Record<string, number>>)?.shots?.away ?? 0, type: 'int' },
        { label: 'Shots on Target', home: (match.stats as Record<string, Record<string, number>>)?.shots_on_target?.home ?? 0, away: (match.stats as Record<string, Record<string, number>>)?.shots_on_target?.away ?? 0, type: 'int' },
        { label: 'PPDA', home: (match.stats as Record<string, Record<string, number>>)?.ppda?.home ?? 0, away: (match.stats as Record<string, Record<string, number>>)?.ppda?.away ?? 0, type: 'dec' },
      ]
    : [];

  const matchDateStr = match
    ? new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + (match.venue ? ` · ${match.venue}` : '')
    : '';

  if (!match && standings.length === 0) return null;

  return (
    <section className="py-24 md:py-32 relative" ref={ref}>
      {/* Section divider with red bleed */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-sws-600/20" />
      <div className="absolute top-0 left-[7%] w-32 h-[1px] bg-gradient-to-r from-red/40 to-transparent" />

      <div className="max-w-container mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-display font-black text-sws-white">Data Room</h2>
            <div className="h-[3px] w-20 bg-gradient-to-r from-red to-red/30 rounded-full" />
          </div>
          <Link
            href="/data-room"
            className="text-xs font-mono text-sws-500 hover:text-sws-white transition-colors flex items-center gap-2"
          >
            ASA + FBREF DATA
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Match Scoreboard */}
          {match && (
            <motion.div
              className="bg-bg-card border border-sws-600/30 rounded-lg p-6 glow-red"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-4">
                Recent Match
              </div>

              {/* Score */}
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="text-right flex-1">
                  <div className="text-sm font-semibold text-sws-white mb-1">{match.home_team}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-mono font-bold text-sws-white">{match.home_score ?? '-'}</span>
                  <span className="text-lg text-sws-500">-</span>
                  <span className="text-4xl font-mono font-bold text-sws-300">{match.away_score ?? '-'}</span>
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-sws-300 mb-1">{match.away_team}</div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-sws-500 text-center mb-6">{matchDateStr}</div>

              {/* Stat bars */}
              <div className="space-y-1">
                {stats.map((stat) => (
                  <StatBar key={stat.label} {...stat} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Standings */}
          {standings.length > 0 && (
            <motion.div
              className="bg-bg-card border border-sws-600/30 rounded-lg p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-4">
                Eastern Conference
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-wider">
                    <th className="text-left py-2 w-8">#</th>
                    <th className="text-left py-2">Team</th>
                    <th className="text-center py-2 w-8">W</th>
                    <th className="text-center py-2 w-8">D</th>
                    <th className="text-center py-2 w-8">L</th>
                    <th className="text-center py-2 w-10">GD</th>
                    <th className="text-center py-2 w-10 text-sws-white">Pts</th>
                    <th className="text-right py-2 w-20">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => {
                    const isNYRB = row.team.includes('Red Bulls');
                    return (
                      <motion.tr
                        key={row.team}
                        className={`border-t border-sws-600/10 ${isNYRB ? 'bg-red/5' : ''}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                      >
                        <td className="py-2.5 text-xs font-mono text-sws-400">{row.position}</td>
                        <td className={`py-2.5 text-xs font-semibold ${isNYRB ? 'text-red' : 'text-sws-200'}`}>
                          {isNYRB && <span className="inline-block w-0.5 h-3 bg-red rounded-full mr-2" />}
                          {row.team}
                        </td>
                        <td className="py-2.5 text-xs font-mono text-center text-sws-300">{row.wins}</td>
                        <td className="py-2.5 text-xs font-mono text-center text-sws-300">{row.draws}</td>
                        <td className="py-2.5 text-xs font-mono text-center text-sws-300">{row.losses}</td>
                        <td className="py-2.5 text-xs font-mono text-center text-sws-300">
                          {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                        </td>
                        <td className="py-2.5 text-xs font-mono font-bold text-center text-sws-white">{row.points}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            {row.form.map((r, j) => <FormDot key={j} result={r} />)}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
