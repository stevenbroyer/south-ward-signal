'use client';

import Link from 'next/link';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { XGTimeline } from '@/components/data/XGTimeline';
import { ShotMap } from '@/components/data/ShotMap';
import { EventTimeline } from '@/components/data/EventTimeline';
import { PlayerRatingGrid } from '@/components/data/PlayerRatingGrid';
import { MomentumChart } from '@/components/data/MomentumChart';
import { StatComparisonBars } from '@/components/data/StatComparisonBars';
import { AveragePositionsMap } from '@/components/data/AveragePositionsMap';
import { H2HComparison } from '@/components/data/H2HComparison';

interface MatchInfo {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeXg: number;
  awayXg: number;
  venue: string;
  status: string;
}

interface StatPair {
  label: string;
  home: number;
  away: number;
  format?: 'int' | 'pct' | 'dec';
}

interface Shot {
  x: number;
  y: number;
  xg: number;
  outcome: 'goal' | 'saved' | 'blocked' | 'off_target' | 'post';
  player: string;
  team: string;
  minute: number;
}

interface PlayerPosition {
  name: string;
  shirtNumber: number;
  x: number;
  y: number;
  isHome: boolean;
}

interface H2HData {
  homeWins: number;
  awayWins: number;
  draws: number;
  events: Array<{ homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; date: string }>;
}

interface MatchDetailClientProps {
  match: MatchInfo;
  statPairs: StatPair[];
  xgTimeline: Array<{ minute: number; homeXg: number; awayXg: number }> | null;
  shots: Shot[];
  events: any[];
  momentum: Array<{ minute: number; value: number }>;
  playerStats: any[];
  averagePositions?: { home: PlayerPosition[]; away: PlayerPosition[] };
  h2h?: H2HData | null;
}

export function MatchDetailClient({
  match,
  statPairs,
  xgTimeline,
  shots,
  events,
  momentum,
  playerStats,
  averagePositions,
  h2h,
}: MatchDetailClientProps) {
  const isNYRBHome = match.homeTeam.includes('Red Bulls');
  const nybWon = isNYRBHome
    ? match.homeScore > match.awayScore
    : match.awayScore > match.homeScore;

  // Split shots by team for the shot map - show NYRB shots
  const nyrbShots = shots
    .filter((s) => s.team?.includes('Red Bulls'))
    .map((s) => ({
      x: s.x,
      y: s.y,
      xg: s.xg,
      outcome: s.outcome as 'goal' | 'saved' | 'blocked' | 'off_target',
      player: s.player,
    }));

  // Goals for xG timeline
  const goals = events
    .filter((e: any) => e.type === 'Goal')
    .map((e: any) => ({
      minute: e.time,
      team: e.isHome ? 'home' as const : 'away' as const,
      player: e.player?.name || 'Unknown',
    }));

  return (
    <div>
      {/* Back link */}
      <Link
        href="/data-room/matches"
        className="inline-flex items-center gap-1 text-xs font-mono text-sws-500 hover:text-sws-300 transition-colors mb-6"
      >
        ← All Matches
      </Link>

      {/* Score Header */}
      <RevealOnScroll>
        <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-6 mb-6 ${nybWon ? 'glow-red' : ''}`}>
          <div className="text-center mb-2">
            <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">
              {new Date(match.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[10px] font-mono text-sws-600">{match.venue}</p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-right flex-1">
              <p className={`font-display font-bold text-lg ${isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>
                {match.homeTeam}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-mono font-bold text-sws-white">{match.homeScore}</span>
              <span className="text-lg font-mono text-sws-600">-</span>
              <span className="text-5xl font-mono font-bold text-sws-300">{match.awayScore}</span>
            </div>
            <div className="text-left flex-1">
              <p className={`font-display font-bold text-lg ${!isNYRBHome ? 'text-sws-white' : 'text-sws-400'}`}>
                {match.awayTeam}
              </p>
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-mono text-sws-500">
              xG: {match.homeXg.toFixed(2)} - {match.awayXg.toFixed(2)}
            </span>
          </div>
        </div>
      </RevealOnScroll>

      {/* xG Timeline & Shot Map — only show if we have data */}
      {(xgTimeline || nyrbShots.length > 0) && (
        <RevealOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {xgTimeline && (
              <XGTimeline
                data={xgTimeline}
                goals={goals}
                homeLabel={match.homeTeam.split(' ').pop() || 'Home'}
                awayLabel={match.awayTeam.split(' ').pop() || 'Away'}
              />
            )}
            {nyrbShots.length > 0 && <ShotMap shots={nyrbShots} />}
          </div>
        </RevealOnScroll>
      )}

      {/* Events & Stats */}
      <RevealOnScroll>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EventTimeline
            events={events}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />
          <StatComparisonBars
            stats={statPairs}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />
        </div>
      </RevealOnScroll>

      {/* Momentum */}
      {momentum.length > 0 && (
        <RevealOnScroll>
          <div className="mb-6">
            <MomentumChart
              data={momentum}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
            />
          </div>
        </RevealOnScroll>
      )}

      {/* Average Positions & H2H */}
      {(averagePositions?.home?.length || h2h) && (
        <RevealOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {averagePositions && averagePositions.home.length > 0 && (
              <AveragePositionsMap
                home={averagePositions.home}
                away={averagePositions.away}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
              />
            )}
            {h2h && (
              <H2HComparison
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeWins={h2h.homeWins}
                awayWins={h2h.awayWins}
                draws={h2h.draws}
                recentMatches={h2h.events}
              />
            )}
          </div>
        </RevealOnScroll>
      )}

      {/* Player Ratings */}
      <RevealOnScroll>
        <PlayerRatingGrid
          players={playerStats}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
        />
      </RevealOnScroll>
    </div>
  );
}
