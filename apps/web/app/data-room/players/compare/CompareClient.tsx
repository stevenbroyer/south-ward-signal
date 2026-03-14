'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlayerComparisonRadar } from '@/components/data/PlayerComparisonRadar';

interface PlayerOption {
  name: string;
  position: string;
}

interface ComparePlayerData {
  name: string;
  stats: Record<string, number>;
  raw: any;
}

interface CompareClientProps {
  playerOptions: PlayerOption[];
  selectedNames: string[];
  compareData: ComparePlayerData[];
}

export function CompareClient({ playerOptions, selectedNames, compareData }: CompareClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const togglePlayer = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let current = selectedNames.includes(name)
      ? selectedNames.filter((n) => n !== name)
      : [...selectedNames, name].slice(0, 4); // Max 4 players

    if (current.length) {
      params.set('players', current.map(encodeURIComponent).join(','));
    } else {
      params.delete('players');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <Link
        href="/data-room/players"
        className="inline-flex items-center gap-1 text-xs font-mono text-sws-500 hover:text-sws-300 transition-colors mb-6"
      >
        ← All Players
      </Link>

      <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">
        Select Players to Compare (up to 4)
      </h2>

      {/* Player Selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {playerOptions.map((p) => {
          const isSelected = selectedNames.includes(p.name);
          return (
            <button
              key={p.name}
              onClick={() => togglePlayer(p.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                isSelected
                  ? 'bg-red/15 text-red border border-red/30'
                  : 'text-sws-400 border border-sws-700/30 hover:border-sws-600 hover:text-sws-300'
              }`}
            >
              {p.name}
              <span className="text-sws-600 ml-1">{p.position}</span>
            </button>
          );
        })}
      </div>

      {/* Radar Chart */}
      <div className="mb-6">
        <PlayerComparisonRadar players={compareData} />
      </div>

      {/* Stat Comparison Table */}
      {compareData.length >= 2 && (
        <div className="bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
                  <th className="text-left py-3 px-4">Stat</th>
                  {compareData.map((p) => (
                    <th key={p.name} className="text-center py-3 px-3">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Games', key: 'games_played' },
                  { label: 'Minutes', key: 'minutes' },
                  { label: 'Goals', key: 'goals' },
                  { label: 'Assists', key: 'assists' },
                  { label: 'Key Passes', key: 'key_passes' },
                  { label: 'Pass Comp.', key: 'pass_completion', dec: 0, suffix: '%' },
                ].map((stat) => {
                  const values = compareData.map((p) => Number(p.raw[stat.key]) || 0);
                  const maxVal = Math.max(...values);

                  return (
                    <tr key={stat.key} className="border-b border-sws-700/20">
                      <td className="py-3 px-4 text-xs font-mono text-sws-400">{stat.label}</td>
                      {compareData.map((p) => {
                        const val = Number(p.raw[stat.key]) || 0;
                        const isBest = val === maxVal && values.filter((v) => v === maxVal).length === 1;
                        const display = stat.dec ? val.toFixed(stat.dec) : String(val);
                        return (
                          <td
                            key={p.name}
                            className={`py-3 px-3 text-center font-mono text-xs ${
                              isBest ? 'text-sws-white font-bold' : 'text-sws-400'
                            }`}
                          >
                            {display}{stat.suffix || ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
