import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { getTeamMatchTrends, getHomeAwaySplit, getShotZones, getFormStreak } from '@/lib/data-room-queries';
import { TeamClient } from './TeamClient';

export const revalidate = 60;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2025;

  const [trends, homeAway, shotZones, formStreak] = await Promise.all([
    getTeamMatchTrends(season),
    getHomeAwaySplit(season),
    getShotZones(season),
    getFormStreak(season, 34),
  ]);

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
    />
  );
}
