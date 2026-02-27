'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { BumpChart } from '@/components/data/BumpChart';
import { XgScatter } from '@/components/data/XgScatter';

interface LeagueClientProps {
  standings: any[];
  standingsHistory: any[];
  xgScatter: any[];
  topScorers: any[];
}

export function LeagueClient({
  standings,
  standingsHistory,
  xgScatter,
  topScorers,
}: LeagueClientProps) {
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: '-40px' });
  const isNYRB = (name: string) => name?.includes('Red Bulls');

  return (
    <div>
      {/* Enhanced Standings Table */}
      <RevealOnScroll>
        <div ref={tableRef} className="bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden mb-6">
          <div className="p-5 border-b border-sws-700/40">
            <h3 className="font-display font-bold text-lg text-sws-white">Eastern Conference</h3>
            <p className="text-xs font-mono text-sws-500 mt-1">Enhanced with xG data</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
                  <th className="text-left py-3 px-4 w-10">#</th>
                  <th className="text-left py-3 px-2">Team</th>
                  <th className="text-center py-3 px-2">P</th>
                  <th className="text-center py-3 px-2">W</th>
                  <th className="text-center py-3 px-2">D</th>
                  <th className="text-center py-3 px-2">L</th>
                  <th className="text-center py-3 px-2">GD</th>
                  <th className="text-center py-3 px-2 font-bold">Pts</th>
                  <th className="text-center py-3 px-2 hidden md:table-cell">PPG</th>
                  <th className="text-center py-3 px-2 hidden lg:table-cell">xGD</th>
                  <th className="text-center py-3 px-2 hidden lg:table-cell">G+</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row: any, i: number) => (
                  <motion.tr
                    key={row.team}
                    className={`border-b border-sws-700/20 transition-colors hover:bg-bg-elevated/50 ${
                      isNYRB(row.team) ? 'bg-red/5 border-l-2 border-l-red' : ''
                    }`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={tableInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <td className="py-3 px-4 font-mono text-sws-500 text-xs">{row.position}</td>
                    <td className={`py-3 px-2 font-medium truncate max-w-[180px] ${isNYRB(row.team) ? 'text-sws-white font-semibold' : 'text-sws-300'}`}>
                      <span className="inline-flex items-center gap-2">
                        {row.logo_url && (
                          <Image
                            src={row.logo_url}
                            alt={row.team}
                            width={20}
                            height={20}
                            className="rounded-sm flex-shrink-0"
                            unoptimized
                          />
                        )}
                        {row.team}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{row.games_played}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{row.wins}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{row.draws}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{row.losses}</td>
                    <td className={`py-3 px-2 text-center font-mono text-xs ${row.goal_difference > 0 ? 'text-success' : row.goal_difference < 0 ? 'text-red' : 'text-sws-500'}`}>
                      {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-sws-white text-sm">{row.points}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden md:table-cell">
                      {row.ppg ? Number(row.ppg).toFixed(2) : '—'}
                    </td>
                    <td className={`py-3 px-2 text-center font-mono text-xs hidden lg:table-cell ${
                      row.xg_diff != null && row.xg_diff > 0 ? 'text-success' :
                      row.xg_diff != null && row.xg_diff < 0 ? 'text-red' :
                      'text-sws-400'
                    }`}>
                      {row.xg_diff != null ? (row.xg_diff > 0 ? '+' : '') + Number(row.xg_diff).toFixed(1) : '—'}
                    </td>
                    <td className={`py-3 px-2 text-center font-mono text-xs hidden lg:table-cell ${
                      row.goals_added != null && row.goals_added > 0 ? 'text-success' :
                      row.goals_added != null && row.goals_added < 0 ? 'text-red' :
                      'text-sws-400'
                    }`}>
                      {row.goals_added != null ? Number(row.goals_added).toFixed(1) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </RevealOnScroll>

      {/* Bump Chart & xG Scatter */}
      <RevealOnScroll>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BumpChart data={standingsHistory} />
          <XgScatter data={xgScatter} />
        </div>
      </RevealOnScroll>

      {/* Top Scorers */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-sws-700/40">
            <h3 className="font-display font-bold text-lg text-sws-white">Top Scorers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-2">Player</th>
                  <th className="text-left py-3 px-2 hidden sm:table-cell">Team</th>
                  <th className="text-center py-3 px-2">G</th>
                  <th className="text-center py-3 px-2">A</th>
                  <th className="text-center py-3 px-2 hidden sm:table-cell">xG</th>
                  <th className="text-center py-3 px-2 hidden md:table-cell">GP</th>
                </tr>
              </thead>
              <tbody>
                {topScorers.map((p: any, i: number) => (
                  <tr
                    key={`${p.name}-${p.team}`}
                    className={`border-b border-sws-700/20 hover:bg-bg-elevated/50 ${
                      isNYRB(p.team) ? 'bg-red/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-sws-500 text-xs">{i + 1}</td>
                    <td className={`py-3 px-2 font-medium ${isNYRB(p.team) ? 'text-red' : 'text-sws-300'}`}>
                      {p.name}
                    </td>
                    <td className="py-3 px-2 text-xs text-sws-500 truncate max-w-[150px] hidden sm:table-cell">
                      {p.team}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-sws-white text-xs font-bold">{p.goals}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{p.assists}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">
                      {Number(p.xg).toFixed(1)}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-sws-500 text-xs hidden md:table-cell">
                      {p.games_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}
