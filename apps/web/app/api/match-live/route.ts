import { NextResponse } from 'next/server';
import type { MatchDayContext } from '@/lib/match-day';

/**
 * Real-time NYRB match state straight from ESPN's free API — bypasses the
 * 3-hour DB sync so the homepage banner can show LIVE scores as they happen.
 * The match-day banner polls this every ~25s while a game is in progress.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ESPN_BASE = 'https://site.api.espn.com/apis';
const MLS_SPORT = 'soccer/usa.1';
const ESPN_RBNY_ID = 190;

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymd(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

const OFF: MatchDayContext = { state: 'OFF_DAY', match: null, hoursOffset: 0 };

export async function GET() {
  try {
    // Look at a 3-day window around now to find RBNY's current/nearby match.
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    const to = new Date(now);
    to.setDate(to.getDate() + 1);

    const url = `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/scoreboard?dates=${ymd(from)}-${ymd(to)}`;
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (!res.ok) return NextResponse.json(OFF);

    const data = await res.json();
    const events: any[] = data?.events || [];

    // RBNY events in the window.
    const rbny = events.filter((e) =>
      (e.competitions?.[0]?.competitors || []).some((c: any) => Number(c.team?.id) === ESPN_RBNY_ID),
    );
    if (!rbny.length) return NextResponse.json(OFF, { headers: cacheHeaders() });

    // Prefer an in-progress game; otherwise the one closest to now.
    const live = rbny.find((e) => e.competitions?.[0]?.status?.type?.state === 'in');
    const pick =
      live ||
      rbny.sort(
        (a, b) =>
          Math.abs(new Date(a.date).getTime() - now.getTime()) -
          Math.abs(new Date(b.date).getTime() - now.getTime()),
      )[0];

    const comp = pick.competitions?.[0];
    const competitors = comp?.competitors || [];
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');
    if (!home || !away) return NextResponse.json(OFF, { headers: cacheHeaders() });

    const statusType = comp.status?.type;
    const espnState = statusType?.state; // 'pre' | 'in' | 'post'
    const completed = statusType?.completed;
    const kickoff = new Date(pick.date);
    const hoursUntil = (kickoff.getTime() - now.getTime()) / 3_600_000;
    const score = (c: any) => {
      const v = c?.score;
      if (v == null) return 0;
      if (typeof v === 'object') return Number(v.value ?? v.displayValue ?? 0);
      return Number(v) || 0;
    };

    const match = {
      id: String(pick.id),
      homeTeam: home.team?.displayName || '',
      awayTeam: away.team?.displayName || '',
      homeScore: espnState === 'pre' ? null : score(home),
      awayScore: espnState === 'pre' ? null : score(away),
      date: pick.date,
      venue: comp.venue?.fullName || 'Red Bull Arena',
      competition: data?.leagues?.[0]?.abbreviation || 'MLS',
      status: espnState === 'in' ? 'live' : completed ? 'finished' : 'scheduled',
      statusDetail: statusType?.shortDetail || statusType?.detail || null,
    };

    let context: MatchDayContext = OFF;
    if (espnState === 'in') {
      context = { state: 'LIVE', match, hoursOffset: 0 };
    } else if (espnState === 'post' || completed) {
      // POST for ~4 hours after the final whistle (kickoff + ~2h).
      const hoursSinceEnd = (now.getTime() - (kickoff.getTime() + 2 * 3_600_000)) / 3_600_000;
      if (hoursSinceEnd >= 0 && hoursSinceEnd <= 4) {
        context = { state: 'POST_MATCH', match, hoursOffset: Math.round(hoursSinceEnd) };
      }
    } else if (espnState === 'pre' && hoursUntil > 0 && hoursUntil <= 6) {
      context = { state: 'PRE_MATCH', match, hoursOffset: Math.max(1, Math.round(hoursUntil)) };
    }

    return NextResponse.json(context, { headers: cacheHeaders() });
  } catch {
    return NextResponse.json(OFF);
  }
}

function cacheHeaders() {
  return { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' };
}
