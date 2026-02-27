'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { MetricCard } from '@/components/data/MetricCard';
import { FormStreak } from '@/components/data/FormStreak';
import { HomeAwayComparison } from '@/components/data/HomeAwayComparison';
import { ShotZoneHeatmap } from '@/components/data/ShotZoneHeatmap';
import { GoalkeeperRadar } from '@/components/data/GoalkeeperRadar';

interface TeamClientProps {
  xgTrend: any[];
  resultTimeline: any[];
  homeAway: { home: any; away: any };
  shotZones: any[];
  defenseStats: { xgaTrend: any[]; cleanSheets: number; avgPpda: number };
  formStreak: any[];
  gkRadar?: { playerName: string; metrics: Array<{ stat: string; value: number; average: number }> } | null;
}

function XgTrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-bg-elevated border border-sws-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-[10px] font-mono text-sws-500 mb-1">MW {d.matchweek} — vs {d.opponent} ({d.result})</p>
      <p className="text-xs font-mono text-red">xG For: {d.xgFor}</p>
      <p className="text-xs font-mono text-sws-400">xG Against: {d.xgAgainst}</p>
      <p className="text-xs font-mono text-red/60">Rolling xGF: {d.rollingXgFor}</p>
    </div>
  );
}

export function TeamClient({
  xgTrend,
  resultTimeline,
  homeAway,
  shotZones,
  defenseStats,
  formStreak,
  gkRadar,
}: TeamClientProps) {
  const totalGames = resultTimeline.length || 1;
  const wins = resultTimeline.filter((r) => r.result === 'W').length;
  const draws = resultTimeline.filter((r) => r.result === 'D').length;
  const losses = resultTimeline.filter((r) => r.result === 'L').length;

  return (
    <div>
      {/* Summary */}
      <RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Record" value={wins} suffix={`W ${draws}D ${losses}L`} />
          <MetricCard label="Clean Sheets" value={defenseStats.cleanSheets} trend={defenseStats.cleanSheets > 0 ? 'up' : undefined} />
          <MetricCard label="Avg PPDA" value={defenseStats.avgPpda} decimals={1} />
          <MetricCard label="Games" value={totalGames} />
        </div>
      </RevealOnScroll>

      {/* Results Timeline */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5 mb-6">
          <h3 className="font-display font-bold text-lg text-sws-white mb-4">Results Timeline</h3>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {resultTimeline.map((r, i) => (
              <div
                key={i}
                className="flex flex-col items-center min-w-[24px]"
                title={`MW${r.matchweek}: ${r.result} vs ${r.opponent} (${r.goalsFor}-${r.goalsAgainst})`}
              >
                <div
                  className={`w-5 h-5 rounded-full ${
                    r.result === 'W' ? 'bg-success' :
                    r.result === 'D' ? 'bg-gold' :
                    'bg-red'
                  }`}
                  style={{ opacity: 0.7 }}
                />
                <span className="text-[8px] font-mono text-sws-600 mt-1">{r.matchweek}</span>
              </div>
            ))}
          </div>
        </div>
      </RevealOnScroll>

      {/* xG Trend */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-sws-white">xG Trend</h3>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] bg-red inline-block rounded" />
                xGF (rolling)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] bg-sws-400 inline-block rounded" />
                xGA (rolling)
              </span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xgTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A32" vertical={false} />
                <XAxis
                  dataKey="matchweek"
                  tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={{ stroke: '#2A2A32' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#44444F', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<XgTrendTooltip />} />
                {/* Raw xG as faded dots */}
                <Line
                  type="monotone"
                  dataKey="xgFor"
                  stroke="#ED1A3D"
                  strokeWidth={0}
                  dot={{ fill: '#ED1A3D', r: 2, fillOpacity: 0.3, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="xgAgainst"
                  stroke="#6E6E7A"
                  strokeWidth={0}
                  dot={{ fill: '#6E6E7A', r: 2, fillOpacity: 0.3, strokeWidth: 0 }}
                />
                {/* Rolling average lines */}
                <Line
                  type="monotone"
                  dataKey="rollingXgFor"
                  stroke="#ED1A3D"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="rollingXgAgainst"
                  stroke="#6E6E7A"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RevealOnScroll>

      {/* Home/Away & Shot Zones */}
      <RevealOnScroll>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HomeAwayComparison home={homeAway.home} away={homeAway.away} />
          <ShotZoneHeatmap shots={shotZones} />
        </div>
      </RevealOnScroll>

      {/* Goalkeeper Analytics */}
      {gkRadar && (
        <RevealOnScroll>
          <div className="mb-6">
            <GoalkeeperRadar
              playerName={gkRadar.playerName}
              metrics={gkRadar.metrics}
            />
          </div>
        </RevealOnScroll>
      )}

      {/* Full Form */}
      <RevealOnScroll>
        <FormStreak matches={formStreak} />
      </RevealOnScroll>
    </div>
  );
}
