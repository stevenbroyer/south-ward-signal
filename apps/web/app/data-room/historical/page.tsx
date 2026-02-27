import {
  getMultiSeasonTeamStats,
  getAllTimePlayerContributions,
  getHistoricalFormGrid,
} from '@/lib/data-room-queries';
import { HistoricalClient } from './HistoricalClient';

export const revalidate = 300; // 5 min, historical data changes rarely

export default async function HistoricalPage() {
  const [teamStats, playerContributions, formGrid] = await Promise.all([
    getMultiSeasonTeamStats(2016, 2026),
    getAllTimePlayerContributions(),
    getHistoricalFormGrid(),
  ]);

  // Season-over-season points
  const pointsBySeason = teamStats.map((s: any) => ({
    season: s.season,
    points: s.points || 0,
    gamesPlayed: s.games_played || 0,
    ppg: s.games_played > 0 ? +(s.points / s.games_played).toFixed(2) : 0,
  }));

  // xG evolution
  const xgBySeason = teamStats.map((s: any) => ({
    season: s.season,
    xgFor: Number(s.xg_for) || 0,
    xgAgainst: Number(s.xg_against) || 0,
    xgDiff: Number(s.xg_diff) || 0,
  }));

  // Goals Added evolution
  const gaBySeason = teamStats
    .filter((s: any) => s.goals_added != null)
    .map((s: any) => ({
      season: s.season,
      goalsAdded: Number(s.goals_added),
    }));

  // Aggregate player contributions (sum across seasons, top 20)
  const playerMap = new Map<string, { goals: number; assists: number; xg: number; goalsAdded: number; seasons: number; minutes: number }>();
  for (const p of playerContributions) {
    const key = p.player_name;
    const existing = playerMap.get(key) || { goals: 0, assists: 0, xg: 0, goalsAdded: 0, seasons: 0, minutes: 0 };
    existing.goals += p.goals || 0;
    existing.assists += p.assists || 0;
    existing.xg += Number(p.xg) || 0;
    existing.goalsAdded += Number(p.goals_added) || 0;
    existing.seasons += 1;
    existing.minutes += p.minutes || 0;
    playerMap.set(key, existing);
  }

  const allTimePlayers = Array.from(playerMap.entries())
    .map(([name, stats]) => ({ name, ...stats, xg: +stats.xg.toFixed(1), goalsAdded: +stats.goalsAdded.toFixed(2) }))
    .sort((a, b) => b.goalsAdded - a.goalsAdded)
    .slice(0, 30);

  return (
    <HistoricalClient
      pointsBySeason={pointsBySeason}
      xgBySeason={xgBySeason}
      gaBySeason={gaBySeason}
      allTimePlayers={allTimePlayers}
      formGrid={formGrid}
    />
  );
}
