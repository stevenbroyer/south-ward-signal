'use client';

import Image from 'next/image';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { MatchScoreboard } from '@/components/data/MatchScoreboard';
import { StandingsTable } from '@/components/data/StandingsTable';
import { MetricCard } from '@/components/data/MetricCard';
import { XgRaceChart } from '@/components/data/XgRaceChart';
import { FormStreak } from '@/components/data/FormStreak';
import { PointsTrajectoryChart } from '@/components/data/PointsTrajectoryChart';
import type { OverviewMetrics } from '@/lib/data-room-queries';
import Link from 'next/link';

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
  logo_url?: string;
}

interface LegacyMetrics {
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

interface TopPerformer {
  name: string;
  position: string | null;
  goals: number;
  assists: number;
  xg: number;
  goals_added: number;
  minutes: number;
  games_played: number;
  image_url?: string | null;
}

interface OverviewClientProps {
  metrics: OverviewMetrics;
  legacyMetrics: LegacyMetrics;
  match: MatchProps | null;
  standings: StandingRow[];
  xgRace: Array<{ matchweek: number; xgFor: number; xgAgainst: number; opponent?: string; result?: string }>;
  formStreak: Array<{ match_id?: string; match_date?: string; opponent: string; is_home: boolean; result: string; goals_for: number; goals_against: number }>;
  trajectory: Array<{ matchweek: number; points: number; playoffPace: number; shieldPace: number }>;
  topPerformers: TopPerformer[];
}

export function OverviewClient({
  metrics,
  legacyMetrics,
  match,
  standings,
  xgRace,
  formStreak,
  trajectory,
  topPerformers,
}: OverviewClientProps) {
  // Use new metrics where available, fall back to legacy
  const pts = metrics.points || legacyMetrics.points;
  const ppg = metrics.ppg || (legacyMetrics.points && legacyMetrics.xgPerMatch ? +(legacyMetrics.points / Math.max(metrics.gamesPlayed, 1)).toFixed(2) : 0);
  const xgDiff = metrics.xgDiff || 0;
  const gd = metrics.goalsFor - metrics.goalsAgainst;
  const form = metrics.form || [];
  const rank = metrics.confRank;

  return (
    <div>
      {/* Hero Metric Cards */}
      <RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard label="Points" value={pts} trend={pts > 0 ? 'up' : undefined} />
          <MetricCard label="PPG" value={ppg} decimals={2} trend={ppg > 1.5 ? 'up' : undefined} />
          <MetricCard label="xG Diff" value={xgDiff} decimals={1} prefix={xgDiff > 0 ? '+' : ''} trend={xgDiff > 0 ? 'up' : xgDiff < 0 ? 'down' : undefined} />
          <MetricCard label="Goal Diff" value={gd} prefix={gd > 0 ? '+' : ''} trend={gd > 0 ? 'up' : gd < 0 ? 'down' : undefined} />
          <MetricCard
            label="Form"
            value={form.filter((f) => f === 'W').length}
            suffix={`W / ${form.length}`}
          />
          <MetricCard label="Conf. Rank" value={rank} prefix="#" />
        </div>
      </RevealOnScroll>

      {/* Latest Match */}
      <RevealOnScroll>
        <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Latest Match</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
          <div className="space-y-4">
            <FormStreak matches={formStreak} />
          </div>
        </div>
      </RevealOnScroll>

      {/* xG Race & Points Trajectory */}
      <RevealOnScroll>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <XgRaceChart data={xgRace} />
          <PointsTrajectoryChart data={trajectory} />
        </div>
      </RevealOnScroll>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <RevealOnScroll>
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {topPerformers.map((p, i) => (
              <Link
                key={p.name}
                href={`/data-room/players/${encodeURIComponent(p.name)}`}
                className="bg-bg-card border border-sws-700/50 rounded-xl p-5 hover:border-red/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-sws-500 uppercase">{p.position}</span>
                  <span className="text-xs font-mono text-red/60">#{i + 1}</span>
                </div>
                <div className="flex items-center gap-3">
                  {p.image_url && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-sws-700/50 flex-shrink-0">
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="font-display font-bold text-sws-white group-hover:text-red transition-colors">
                    {p.name}
                  </p>
                </div>
                <div className="flex gap-4 mt-3 text-xs font-mono text-sws-400">
                  <span>{p.goals}G</span>
                  <span>{p.assists}A</span>
                  <span>{p.games_played} GP</span>
                  <span>{p.minutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        </RevealOnScroll>
      )}

      {/* Quick Standings */}
      <RevealOnScroll>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest">Standings</h2>
          <Link href="/data-room/league" className="text-xs font-mono text-red hover:text-red/80 transition-colors">
            Full Table →
          </Link>
        </div>
        {standings.length > 0 ? (
          <StandingsTable standings={standings} />
        ) : (
          <StandingsTable />
        )}
      </RevealOnScroll>
    </div>
  );
}
