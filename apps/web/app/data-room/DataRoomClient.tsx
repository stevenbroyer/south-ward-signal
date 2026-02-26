'use client';

import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { MatchScoreboard } from '@/components/data/MatchScoreboard';
import { StandingsTable } from '@/components/data/StandingsTable';
import { XGTimeline } from '@/components/data/XGTimeline';
import { PlayerRadar } from '@/components/data/PlayerRadar';
import { ShotMap } from '@/components/data/ShotMap';
import { MetricCard } from '@/components/data/MetricCard';

interface SeasonMetrics {
  xgPerMatch: number;
  points: number;
  goalDifference: number;
  ppda: number;
  goalsScored: number;
  assists: number;
  shotsPer90: number;
  bigChances: number;
  goalsConceded: number;
  cleanSheets: number;
  tacklesWon: number;
  interceptionsPer90: number;
}

interface MatchProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  venue: string;
  possession: [number, number];
  shots: [number, number];
  xg: [number, number];
}

interface StandingRow {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  pts: number;
  form: ('W' | 'D' | 'L')[];
}

interface DataRoomClientProps {
  metrics: SeasonMetrics;
  match: MatchProps | null;
  standings: StandingRow[];
}

export default function DataRoomClient({ metrics, match, standings }: DataRoomClientProps) {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-container mx-auto px-6">
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-12">
            <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">Analytics</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white">Data Room</h1>
            <p className="text-sws-400 mt-3 max-w-lg">
              Advanced metrics, match data, and statistical analysis for the New York Red Bulls 2026 season.
            </p>
          </div>
        </RevealOnScroll>

        {/* Team Stats Grid */}
        <RevealOnScroll>
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Season Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <MetricCard label="xG Per Match" value={metrics.xgPerMatch} decimals={2} trend="up" />
            <MetricCard label="Points" value={metrics.points} trend="up" />
            <MetricCard label="Goal Difference" value={metrics.goalDifference} prefix={metrics.goalDifference > 0 ? '+' : ''} trend={metrics.goalDifference > 0 ? 'up' : 'down'} />
            <MetricCard label="PPDA" value={metrics.ppda} decimals={1} trend={metrics.ppda > 0 ? 'down' : undefined} />
          </div>
        </RevealOnScroll>

        {/* Recent Match */}
        <RevealOnScroll>
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Recent Match</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {match ? (
              <MatchScoreboard
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                date={match.date}
                venue={match.venue}
                possession={match.possession}
                shots={match.shots}
                xg={match.xg}
              />
            ) : (
              <MatchScoreboard />
            )}
            <XGTimeline />
          </div>
        </RevealOnScroll>

        {/* Shot Map & Player Radar */}
        <RevealOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <ShotMap />
            <PlayerRadar />
          </div>
        </RevealOnScroll>

        {/* Standings */}
        <RevealOnScroll>
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4" id="standings">Standings</h2>
          {standings.length > 0 ? (
            <StandingsTable standings={standings} className="mb-12" />
          ) : (
            <StandingsTable className="mb-12" />
          )}
        </RevealOnScroll>

        {/* Attacking Metrics */}
        <RevealOnScroll>
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Attacking Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <MetricCard label="Goals Scored" value={metrics.goalsScored} trend="up" />
            <MetricCard label="Assists" value={metrics.assists} />
            <MetricCard label="Shots Per 90" value={metrics.shotsPer90} decimals={1} trend="up" />
            <MetricCard label="Big Chances" value={metrics.bigChances} trend={metrics.bigChances > 0 ? 'up' : undefined} />
          </div>
        </RevealOnScroll>

        {/* Defensive Metrics */}
        <RevealOnScroll>
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Defensive Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Goals Conceded" value={metrics.goalsConceded} trend="down" />
            <MetricCard label="Clean Sheets" value={metrics.cleanSheets} />
            <MetricCard label="Tackles Won" value={metrics.tacklesWon} trend={metrics.tacklesWon > 0 ? 'up' : undefined} />
            <MetricCard label="Interceptions/90" value={metrics.interceptionsPer90} decimals={1} />
          </div>
        </RevealOnScroll>
      </div>
    </div>
  );
}
