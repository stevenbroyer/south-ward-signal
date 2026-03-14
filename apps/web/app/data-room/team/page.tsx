import { getTeamMatchTrends, getHomeAwaySplit, getShotZones, getFormStreak, getGKStats } from '@/lib/data-room-queries';
import { TeamClient } from './TeamClient';

export const revalidate = 60;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;

  const [trends, homeAway, shotZones, formStreak, gkStats] = await Promise.all([
    getTeamMatchTrends(season),
    getHomeAwaySplit(season),
    getShotZones(season),
    getFormStreak(season, 34),
    getGKStats(season),
  ]);

  // Build xG trend data with rolling average
  const xgTrend = trends.map((m: any, i: number) => {
    const window = trends.slice(Math.max(0, i - 4), i + 1);
    const rollingXgFor = +(window.reduce((s: number, w: any) => s + Number(w.xg_for || 0), 0) / window.length).toFixed(2);
    const rollingXgAgainst = +(window.reduce((s: number, w: any) => s + Number(w.xg_against || 0), 0) / window.length).toFixed(2);

    return {
      matchweek: i + 1,
      xgFor: Number(m.xg_for) || 0,
      xgAgainst: Number(m.xg_against) || 0,
      rollingXgFor,
      rollingXgAgainst,
      opponent: m.opponent,
      result: m.result,
    };
  });

  // Results timeline
  const resultTimeline = trends.map((m: any, i: number) => ({
    matchweek: i + 1,
    result: m.result,
    opponent: m.opponent,
    goalsFor: m.goals_for,
    goalsAgainst: m.goals_against,
  }));

  // Defensive stats
  const defenseStats = {
    xgaTrend: trends.map((m: any, i: number) => ({
      matchweek: i + 1,
      xga: Number(m.xg_against) || 0,
    })),
    cleanSheets: trends.filter((m: any) => m.clean_sheet).length,
    avgPpda: 0,
  };

  // Build GK radar from real data
  const primaryGk = (gkStats || []).sort((a: any, b: any) => b.games_played - a.games_played)[0];
  let gkRadar = null;
  if (primaryGk && primaryGk.games_played > 0) {
    const saveRate = primaryGk.saves > 0 && primaryGk.goals_conceded >= 0
      ? Math.min(100, Math.round((primaryGk.saves / (primaryGk.saves + primaryGk.goals_conceded)) * 100))
      : 0;
    const cleanSheetRate = primaryGk.games_played > 0
      ? Math.min(100, Math.round((primaryGk.clean_sheets / primaryGk.games_played) * 100))
      : 0;
    // Normalize stats to 0-100 scale for radar
    gkRadar = {
      playerName: primaryGk.name,
      metrics: [
        { stat: 'Save %', value: saveRate, average: 68 },
        { stat: 'Clean Sheet %', value: cleanSheetRate, average: 30 },
        { stat: 'Saves/Game', value: Math.min(100, Math.round((primaryGk.saves / Math.max(primaryGk.games_played, 1)) * 20)), average: 50 },
        { stat: 'Games', value: Math.min(100, Math.round((primaryGk.games_played / 34) * 100)), average: 50 },
        { stat: 'GA/Game', value: Math.max(0, 100 - Math.round((primaryGk.goals_conceded / Math.max(primaryGk.games_played, 1)) * 50)), average: 50 },
        { stat: 'Minutes', value: Math.min(100, Math.round((primaryGk.minutes / 3060) * 100)), average: 50 },
      ],
    };
  }

  return (
    <TeamClient
      xgTrend={xgTrend}
      resultTimeline={resultTimeline}
      homeAway={homeAway}
      shotZones={shotZones}
      defenseStats={defenseStats}
      formStreak={formStreak}
      gkRadar={gkRadar}
    />
  );
}
