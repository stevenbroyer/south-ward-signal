'use client';

import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { MetricCard } from '@/components/data/MetricCard';
import { PlayerRadar } from '@/components/data/PlayerRadar';
import { SeasonProgressionChart } from '@/components/data/SeasonProgressionChart';
import { GoalsAddedBreakdown } from '@/components/data/GoalsAddedBreakdown';

interface PlayerDetailClientProps {
  player: any;
  radarMetrics: Array<{ stat: string; player: number; average: number }>;
  progression: Array<{ matchweek: number; goals: number; xg: number; assists: number }>;
  gaBreakdown: any;
  history: any[];
  matchLog: any[];
}

export function PlayerDetailClient({
  player,
  radarMetrics,
  progression,
  gaBreakdown,
  history,
  matchLog,
}: PlayerDetailClientProps) {
  return (
    <div>
      {/* Player Header */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-red uppercase tracking-widest mb-2">{player.position}</p>
              <h2 className="font-display font-black text-3xl text-sws-white">{player.name}</h2>
              <p className="text-sm text-sws-400 mt-1 font-mono">New York Red Bulls</p>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Key Stats */}
      <RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard label="Games" value={player.games_played} />
          <MetricCard label="Minutes" value={player.minutes} />
          <MetricCard label="Goals" value={player.goals} trend={player.goals > 0 ? 'up' : undefined} />
          <MetricCard label="Assists" value={player.assists} />
          <MetricCard label="xG" value={Number(player.xg)} decimals={1} />
          <MetricCard
            label="Goals Added"
            value={Number(player.goals_added) || 0}
            decimals={2}
            prefix={Number(player.goals_added) > 0 ? '+' : ''}
            trend={Number(player.goals_added) > 0 ? 'up' : Number(player.goals_added) < 0 ? 'down' : undefined}
          />
        </div>
      </RevealOnScroll>

      {/* Radar & G+ Breakdown */}
      <RevealOnScroll>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PlayerRadar playerName={player.name} metrics={radarMetrics} />
          <GoalsAddedBreakdown data={gaBreakdown} />
        </div>
      </RevealOnScroll>

      {/* Season Progression */}
      {progression.length > 0 && (
        <RevealOnScroll>
          <div className="mb-6">
            <SeasonProgressionChart data={progression} />
          </div>
        </RevealOnScroll>
      )}

      {/* Match-by-Match Log */}
      {matchLog.length > 0 && (
        <RevealOnScroll>
          <div className="bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden mb-6">
            <div className="p-5 border-b border-sws-700/40">
              <h3 className="font-display font-bold text-lg text-sws-white">Match Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
                    <th className="text-left py-3 px-4">Match</th>
                    <th className="text-center py-3 px-2">Min</th>
                    <th className="text-center py-3 px-2">G</th>
                    <th className="text-center py-3 px-2">A</th>
                    <th className="text-center py-3 px-2 hidden sm:table-cell">xG</th>
                    <th className="text-center py-3 px-2 hidden sm:table-cell">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {matchLog.map((m: any, i: number) => {
                    const match = m.matches;
                    const opponent = match
                      ? (m.team?.includes('Red Bulls')
                        ? (match.home_team?.includes('Red Bulls') ? match.away_team : match.home_team)
                        : (match.home_team?.includes('Red Bulls') ? match.home_team : match.away_team))
                      : '—';
                    return (
                      <tr key={i} className="border-b border-sws-700/20 hover:bg-bg-elevated/50">
                        <td className="py-3 px-4 text-sws-300 text-xs truncate max-w-[200px]">
                          {opponent}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{m.minutes_played || '—'}</td>
                        <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{m.goals || 0}</td>
                        <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{m.assists || 0}</td>
                        <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">
                          {m.xg ? Number(m.xg).toFixed(2) : '—'}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-xs hidden sm:table-cell">
                          {m.fotmob_rating ? (
                            <span className={
                              Number(m.fotmob_rating) >= 7.5 ? 'text-success' :
                              Number(m.fotmob_rating) >= 6.5 ? 'text-gold' :
                              'text-sws-400'
                            }>
                              {Number(m.fotmob_rating).toFixed(1)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </RevealOnScroll>
      )}

      {/* Season History */}
      {history.length > 1 && (
        <RevealOnScroll>
          <div className="bg-bg-card border border-sws-700/50 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-sws-700/40">
              <h3 className="font-display font-bold text-lg text-sws-white">Season History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-mono text-sws-500 uppercase tracking-widest border-b border-sws-700/40">
                    <th className="text-left py-3 px-4">Season</th>
                    <th className="text-center py-3 px-2">GP</th>
                    <th className="text-center py-3 px-2">G</th>
                    <th className="text-center py-3 px-2">A</th>
                    <th className="text-center py-3 px-2 hidden sm:table-cell">xG</th>
                    <th className="text-center py-3 px-2">G+</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.season} className="border-b border-sws-700/20 hover:bg-bg-elevated/50">
                      <td className="py-3 px-4 font-mono text-sws-300 text-xs">{h.season}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{h.games_played}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{h.goals}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{h.assists}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs hidden sm:table-cell">
                        {Number(h.xg).toFixed(1)}
                      </td>
                      <td className={`py-3 px-2 text-center font-mono text-xs ${
                        Number(h.goals_added) > 0 ? 'text-success' : Number(h.goals_added) < 0 ? 'text-red' : 'text-sws-400'
                      }`}>
                        {h.goals_added != null ? (Number(h.goals_added) > 0 ? '+' : '') + Number(h.goals_added).toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </RevealOnScroll>
      )}
    </div>
  );
}
