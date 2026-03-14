'use client';

import Image from 'next/image';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { MetricCard } from '@/components/data/MetricCard';
import { PlayerRadar } from '@/components/data/PlayerRadar';
import { SeasonProgressionChart } from '@/components/data/SeasonProgressionChart';

interface PlayerDetailClientProps {
  player: any;
  radarMetrics: Array<{ stat: string; player: number; average: number }>;
  progression: Array<{ matchweek: number; goals: number; xg: number; assists: number }>;
  history: any[];
  matchLog: any[];
}

export function PlayerDetailClient({
  player,
  radarMetrics,
  progression,
  history,
  matchLog,
}: PlayerDetailClientProps) {
  return (
    <div>
      {/* Player Header */}
      <RevealOnScroll>
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            {player.image_url && (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-sws-700/50 flex-shrink-0">
                <Image
                  src={player.image_url}
                  alt={player.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-mono text-red uppercase tracking-widest mb-2">
                {player.shirt_number ? `#${player.shirt_number} · ` : ''}{player.position}
              </p>
              <h2 className="font-display font-black text-3xl text-sws-white">{player.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-sws-400 font-mono">New York Red Bulls</p>
                {player.nationality && (
                  <span className="text-xs font-mono text-sws-500">{player.nationality}</span>
                )}
                {player.age && (
                  <span className="text-xs font-mono text-sws-500">Age {player.age}</span>
                )}
                {player.preferred_foot && (
                  <span className="text-xs font-mono text-sws-500">{player.preferred_foot} foot</span>
                )}
                {player.height_cm && (
                  <span className="text-xs font-mono text-sws-500">{player.height_cm}cm</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Key Stats */}
      <RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard label="Games" value={player.games_played} />
          <MetricCard label="Minutes" value={player.minutes} />
          <MetricCard label="Goals" value={player.goals} trend={player.goals > 0 ? 'up' : undefined} />
          <MetricCard label="Assists" value={player.assists} />
          <MetricCard label="Key Passes" value={player.key_passes ?? 0} />
          <MetricCard label="Pass Comp." value={Number(player.pass_completion) || 0} suffix="%" />
        </div>
      </RevealOnScroll>

      {/* Player Radar */}
      <RevealOnScroll>
        <div className="mb-6">
          <PlayerRadar playerName={player.name} metrics={radarMetrics} />
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
      {history.length > 0 && (
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
                    <th className="text-center py-3 px-2">Min</th>
                    <th className="text-center py-3 px-2">G</th>
                    <th className="text-center py-3 px-2">A</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.season} className="border-b border-sws-700/20 hover:bg-bg-elevated/50">
                      <td className="py-3 px-4 font-mono text-sws-300 text-xs">{h.season}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{h.games_played}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{h.minutes || '—'}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-300 text-xs">{h.goals}</td>
                      <td className="py-3 px-2 text-center font-mono text-sws-400 text-xs">{h.assists}</td>
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
