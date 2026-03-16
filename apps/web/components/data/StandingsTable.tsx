'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
import { FormBadge } from './FormBadge';
import { isNYRB as checkNYRB } from '@/lib/team-utils';

type FormResult = 'W' | 'D' | 'L';

interface StandingRow {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  pts: number;
  form: FormResult[];
  logo_url?: string;
}

const SAMPLE_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'Inter Miami CF', played: 3, won: 3, drawn: 0, lost: 0, gd: 7, pts: 9, form: ['W','W','W'] },
  { pos: 2, team: 'FC Cincinnati', played: 3, won: 2, drawn: 1, lost: 0, gd: 4, pts: 7, form: ['W','D','W'] },
  { pos: 3, team: 'New York Red Bulls', played: 3, won: 2, drawn: 0, lost: 1, gd: 3, pts: 6, form: ['W','L','W'] },
  { pos: 4, team: 'Columbus Crew', played: 3, won: 2, drawn: 0, lost: 1, gd: 2, pts: 6, form: ['L','W','W'] },
  { pos: 5, team: 'Charlotte FC', played: 3, won: 1, drawn: 2, lost: 0, gd: 1, pts: 5, form: ['D','W','D'] },
  { pos: 6, team: 'Orlando City SC', played: 3, won: 1, drawn: 1, lost: 1, gd: 0, pts: 4, form: ['W','D','L'] },
  { pos: 7, team: 'New York City FC', played: 3, won: 1, drawn: 1, lost: 1, gd: -1, pts: 4, form: ['D','L','W'] },
  { pos: 8, team: 'Philadelphia Union', played: 3, won: 1, drawn: 0, lost: 2, gd: -2, pts: 3, form: ['L','W','L'] },
  { pos: 9, team: 'Atlanta United FC', played: 3, won: 0, drawn: 2, lost: 1, gd: -2, pts: 2, form: ['D','L','D'] },
  { pos: 10, team: 'Nashville SC', played: 3, won: 0, drawn: 1, lost: 2, gd: -3, pts: 1, form: ['L','D','L'] },
  { pos: 11, team: 'CF Montreal', played: 3, won: 0, drawn: 1, lost: 2, gd: -4, pts: 1, form: ['L','L','D'] },
  { pos: 12, team: 'D.C. United', played: 3, won: 0, drawn: 0, lost: 3, gd: -5, pts: 0, form: ['L','L','L'] },
];

interface StandingsTableProps {
  standings?: StandingRow[];
  className?: string;
}

export function StandingsTable({ standings = SAMPLE_STANDINGS, className = '' }: StandingsTableProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const isNYRB = checkNYRB;

  return (
    <div ref={ref} className={`bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden ${className}`}>
      <div className="p-5 border-b border-sws-700/40">
        <h3 className="font-display font-bold text-lg text-sws-white">MLS Standings</h3>
        <p className="text-xs font-mono text-sws-500 mt-1">2026 MLS Season</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
              <th className="text-left py-3 px-4 w-10">#</th>
              <th className="text-left py-3 px-2">Team</th>
              <th className="text-center py-3 px-2 hidden sm:table-cell">P</th>
              <th className="text-center py-3 px-2">W</th>
              <th className="text-center py-3 px-2">D</th>
              <th className="text-center py-3 px-2">L</th>
              <th className="text-center py-3 px-2 hidden sm:table-cell">GD</th>
              <th className="text-center py-3 px-2 font-bold">Pts</th>
              <th className="text-center py-3 px-3 hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <motion.tr
                key={row.team}
                className={`border-b border-sws-700/20 transition-colors hover:bg-bg-elevated/50 ${
                  isNYRB(row.team) ? 'bg-red/5 border-l-2 border-l-red' : ''
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <td className="py-3 px-4 font-mono text-sws-500 text-xs">{row.pos}</td>
                <td className={`py-3 px-2 font-medium truncate max-w-[160px] ${isNYRB(row.team) ? 'text-sws-white font-semibold' : 'text-sws-300'}`}>
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
                <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">{row.played}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{row.won}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{row.drawn}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{row.lost}</td>
                <td className={`py-3 px-2 text-center font-mono text-xs hidden sm:table-cell ${row.gd > 0 ? 'text-success' : row.gd < 0 ? 'text-red' : 'text-sws-500'}`}>
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="py-3 px-2 text-center font-mono font-bold text-sws-white text-sm">{row.pts}</td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <FormBadge form={row.form} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
