// @ts-nocheck
'use client';

import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { HistoricalFormHeatmap } from '@/components/data/HistoricalFormHeatmap';

interface HistoricalClientProps {
  pointsBySeason: Array<{ season: number; points: number; gamesPlayed: number; ppg: number }>;
  xgBySeason: Array<{ season: number; xgFor: number; xgAgainst: number; xgDiff: number }>;
  gaBySeason: Array<{ season: number; goalsAdded: number }>;
  allTimePlayers: Array<{ name: string; goals: number; assists: number; xg: number; goalsAdded: number; seasons: number; minutes: number }>;
  formGrid: any[];
}

function SimpleTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-mono" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? (Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(2)) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function HistoricalClient({
  pointsBySeason,
  xgBySeason,
  gaBySeason,
  allTimePlayers,
  formGrid,
}: HistoricalClientProps) {
  return (
    <div>
      {/* Points by Season */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5 mb-6">
          <h3 className="font-display font-bold text-lg text-sws-white mb-4">Points by Season</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pointsBySeason} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
                <XAxis
                  dataKey="season"
                  tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={{ stroke: '#2A2A32' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="points" name="Points" fill="#ED1A3D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RevealOnScroll>

      {/* xG Evolution */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-sws-white">xG Evolution</h3>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] bg-red inline-block rounded" />
                xG For
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] bg-sws-400 inline-block rounded" />
                xG Against
              </span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xgBySeason} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
                <XAxis
                  dataKey="season"
                  tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={{ stroke: '#2A2A32' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<SimpleTooltip />} />
                <Line type="monotone" dataKey="xgFor" name="xG For" stroke="#ED1A3D" strokeWidth={2.5} dot={{ fill: '#ED1A3D', r: 4 }} />
                <Line type="monotone" dataKey="xgAgainst" name="xG Against" stroke="#6E6E7A" strokeWidth={2} dot={{ fill: '#6E6E7A', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RevealOnScroll>

      {/* Goals Added by Year */}
      {gaBySeason.length > 0 && (
        <RevealOnScroll>
          <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5 mb-6">
            <h3 className="font-display font-bold text-lg text-sws-white mb-4">Goals Added by Year</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gaBySeason} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
                  <XAxis
                    dataKey="season"
                    tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                    axisLine={{ stroke: '#2A2A32' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar
                    dataKey="goalsAdded"
                    name="Goals Added"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </RevealOnScroll>
      )}

      {/* Historical Form Heatmap */}
      <RevealOnScroll>
        <div className="mb-6">
          <HistoricalFormHeatmap data={formGrid} />
        </div>
      </RevealOnScroll>

      {/* All-Time Player Contributions */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-sws-700/40">
            <h3 className="font-display font-bold text-lg text-sws-white">All-Time NYRB Player Contributions</h3>
            <p className="text-xs font-mono text-sws-500 mt-1">2016-2026 · Sorted by Goals Added</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-2">Player</th>
                  <th className="text-center py-3 px-2">Seasons</th>
                  <th className="text-center py-3 px-2 hidden sm:table-cell">Min</th>
                  <th className="text-center py-3 px-2">G</th>
                  <th className="text-center py-3 px-2">A</th>
                  <th className="text-center py-3 px-2 hidden sm:table-cell">xG</th>
                  <th className="text-center py-3 px-2">G+</th>
                </tr>
              </thead>
              <tbody>
                {allTimePlayers.map((p, i) => (
                  <tr key={p.name} className="border-b border-sws-700/20 hover:bg-bg-elevated/50">
                    <td className="py-3 px-4 font-mono text-sws-500 text-xs">{i + 1}</td>
                    <td className="py-3 px-2 text-sws-300 font-medium">{p.name}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{p.seasons}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">
                      {p.minutes.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{p.goals}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{p.assists}</td>
                    <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">{p.xg}</td>
                    <td className={`py-3 px-2 text-center font-mono text-xs font-medium ${
                      p.goalsAdded > 0 ? 'text-success' : p.goalsAdded < 0 ? 'text-red' : 'text-sws-400'
                    }`}>
                      {p.goalsAdded > 0 ? '+' : ''}{p.goalsAdded}
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
