export type MatchDayState = 'PRE_MATCH' | 'LIVE' | 'POST_MATCH' | 'OFF_DAY';

export interface MatchDayContext {
  state: MatchDayState;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    date: string;
    venue: string;
    competition: string;
    status: string;
    /** Live clock/period from ESPN, e.g. "63'", "HT" (LIVE only). */
    statusDetail?: string | null;
  } | null;
  /** Hours until match (PRE_MATCH) or hours since match ended (POST_MATCH) */
  hoursOffset: number;
}

export interface MatchInput {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  competition?: string;
  status: string;
}

/**
 * Determine match-day state from the next/latest match.
 *
 * Rules:
 * - PRE_MATCH: Within 6 hours before kickoff
 * - LIVE: Match status is 'live'
 * - POST_MATCH: Match finished within the last 4 hours
 * - OFF_DAY: Everything else
 */
export function getMatchDayState(
  nextMatch: MatchInput | null,
  latestFinished: MatchInput | null,
): MatchDayContext {
  const now = new Date();

  // Check for LIVE match first
  if (nextMatch && nextMatch.status === 'live') {
    return {
      state: 'LIVE',
      match: mapMatch(nextMatch),
      hoursOffset: 0,
    };
  }

  // Check for POST_MATCH (finished within last 4 hours)
  if (latestFinished && latestFinished.status === 'finished') {
    const finishedTime = new Date(latestFinished.date);
    // Assume match lasts ~2 hours, so "end" is date + 2h
    const matchEnd = new Date(finishedTime.getTime() + 2 * 60 * 60 * 1000);
    const hoursSinceEnd =
      (now.getTime() - matchEnd.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEnd >= 0 && hoursSinceEnd <= 4) {
      return {
        state: 'POST_MATCH',
        match: mapMatch(latestFinished),
        hoursOffset: Math.round(hoursSinceEnd),
      };
    }
  }

  // Check for PRE_MATCH (within 6 hours before kickoff)
  if (nextMatch && (nextMatch.status === 'scheduled' || nextMatch.status === 'live')) {
    const kickoff = new Date(nextMatch.date);
    const hoursUntil =
      (kickoff.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil > 0 && hoursUntil <= 6) {
      return {
        state: 'PRE_MATCH',
        match: mapMatch(nextMatch),
        hoursOffset: Math.round(hoursUntil),
      };
    }
  }

  return { state: 'OFF_DAY', match: null, hoursOffset: 0 };
}

function mapMatch(m: MatchInput) {
  return {
    id: m.id,
    homeTeam: m.home_team,
    awayTeam: m.away_team,
    homeScore: m.home_score,
    awayScore: m.away_score,
    date: m.date,
    venue: m.venue || 'Red Bull Arena',
    competition: m.competition || 'MLS',
    status: m.status,
  };
}
