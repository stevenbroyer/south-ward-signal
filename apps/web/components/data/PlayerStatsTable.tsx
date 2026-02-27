'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Player {
  name: string;
  position: string;
  games_played: number;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  goals_added: number | null;
  key_passes: number | null;
  pass_completion: number | null;
}

type SortKey = 'name' | 'goals' | 'assists' | 'xg' | 'goals_added' | 'minutes' | 'games_played';

interface PlayerStatsTableProps {
  players?: Player[];
  className?: string;
}

export function PlayerStatsTable({ players = [], className = '' }: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('goals_added');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...players].sort((a, b) => {
    const aVal = a[sortKey] ?? -999;
    const bVal = b[sortKey] ?? -999;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, field, className: cls = '' }: { label: string; field: SortKey; className?: string }) => (
    <th
      className={`py-3 px-2 cursor-pointer hover:text-sws-300 transition-colors select-none ${cls}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (
          <span className="text-red">{sortAsc ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  if (!players.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-8 text-center ${className}`}>
        <p className="text-sm font-mono text-sws-500">No player data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
              <SortHeader label="Player" field="name" className="text-left px-4" />
              <th className="py-3 px-2 text-center">Pos</th>
              <SortHeader label="GP" field="games_played" className="text-center" />
              <SortHeader label="Min" field="minutes" className="text-center hidden md:table-cell" />
              <SortHeader label="G" field="goals" className="text-center" />
              <SortHeader label="A" field="assists" className="text-center" />
              <SortHeader label="xG" field="xg" className="text-center hidden sm:table-cell" />
              <SortHeader label="G+" field="goals_added" className="text-center" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <motion.tr
                key={p.name}
                className="border-b border-sws-700/20 hover:bg-bg-elevated/50 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/data-room/players/${encodeURIComponent(p.name)}`}
                    className="text-sws-white hover:text-red transition-colors font-medium"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="py-3 px-2 text-center text-xs font-mono text-sws-500">{p.position}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{p.games_played}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden md:table-cell">{p.minutes}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs font-medium">{p.goals}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{p.assists}</td>
                <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">
                  {Number(p.xg).toFixed(1)}
                </td>
                <td className={`py-3 px-2 text-center font-mono text-xs font-medium ${
                  p.goals_added != null && Number(p.goals_added) > 0 ? 'text-success' :
                  p.goals_added != null && Number(p.goals_added) < 0 ? 'text-red' :
                  'text-sws-400'
                }`}>
                  {p.goals_added != null ? (Number(p.goals_added) > 0 ? '+' : '') + Number(p.goals_added).toFixed(2) : '—'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
