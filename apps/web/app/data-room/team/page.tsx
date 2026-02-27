import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { getTeamMatchTrends, getHomeAwaySplit, getShotZones, getFormStreak, getGKStats } from '@/lib/data-room-queries';
import { getGKXGoals, getGKGoalsAdded } from '@/lib/asa-client';
import { TeamClient } from './TeamClient';

export const revalidate = 60;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2025;

  const [trends, homeAway, shotZones, formStreak, gkDbStats] = await Promise.all([
    getTeamMatchTrends(season),
    getHomeAwaySplit(season),
    getShotZones(season),
    getFormStreak(season, 34),
    getGKStats(season),
  ]);

  // Fetch GK analytics from ASA
  let gkRadarData: { playerName: string; metrics: Array<{ stat: string; value: number; average: number }> } | null = null;
  try {
    const [gkXGoals, gkGA] = await Promise.all([
      getGKXGoals(season),
      getGKGoalsAdded(season),
    ]);
    const primaryGK = gkXGoals[0]; // Most minutes GK
    if (primaryGK) {
      const saveRate = primaryGK.shots_faced > 0
        ? (primaryGK.saves / primaryGK.shots_faced) * 100 : 0;
      const xgPrevented = primaryGK.xgoals_gk_faced > 0
        ? Math.max(0, Math.min(100, 50 + (primaryGK.goals_minus_xgoals_gk * -10))) : 50;
      const gsaa = Math.max(0, Math.min(100, 50 + (primaryGK.goals_minus_xgoals_gk * -8)));

      // GA breakdown for the GK
      const gaData = gkGA.find((g) => g.player_id === primaryGK.player_id);
      const claimingGA = gaData?.data?.find((d) => d.action_type === 'Claiming')?.goals_added_above_avg || 0;
      const sweepingGA = gaData?.data?.find((d) => d.action_type === 'Sweeping')?.goals_added_above_avg || 0;

      gkRadarData = {
        playerName: primaryGK.player_name,
        metrics: [
          { stat: 'Save %', value: Math.min(100, saveRate), average: 68 },
          { stat: 'xG Prevented', value: xgPrevented, average: 50 },
          { stat: 'GSAA', value: gsaa, average: 50 },
          { stat: 'Crosses Claimed', value: Math.max(0, Math.min(100, 50 + claimingGA * 20)), average: 50 },
          { stat: 'Distribution', value: 55, average: 50 },
          { stat: 'Sweeping', value: Math.max(0, Math.min(100, 50 + sweepingGA * 20)), average: 50 },
        ],
      };
    }
  } catch { /* GK data may not be available */ }

  // Build xG trend data with rolling average
  const xgTrend = trends.map((m: any, i: number) => {
    // 5-game rolling average
    const window = trends.slice(Math.max(0, i - 4), i + 1);
    const rollingXgFor = +(window.reduce((s: number, w: any) => s + Number(w.xg_for), 0) / window.length).toFixed(2);
    const rollingXgAgainst = +(window.reduce((s: number, w: any) => s + Number(w.xg_against), 0) / window.length).toFixed(2);

    return {
      matchweek: i + 1,
      xgFor: Number(m.xg_for),
      xgAgainst: Number(m.xg_against),
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
      xga: Number(m.xg_against),
    })),
    cleanSheets: trends.filter((m: any) => m.clean_sheet).length,
    avgPpda: trends.length
      ? +(trends.reduce((s: number, m: any) => s + (Number(m.ppda) || 0), 0) / trends.length).toFixed(1)
      : 0,
  };

  return (
    <TeamClient
      xgTrend={xgTrend}
      resultTimeline={resultTimeline}
      homeAway={homeAway}
      shotZones={shotZones}
      defenseStats={defenseStats}
      formStreak={formStreak}
      gkRadar={gkRadarData}
    />
  );
}
