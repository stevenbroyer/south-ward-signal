'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchMatches, type MatchFilters } from '@/lib/data-room-api';
import { MatchCard } from '@/components/data/MatchCard';

interface Match {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_team_id?: number;
  away_team_id?: number;
  home_score: number | null;
  away_score: number | null;
  home_xg: number | null;
  away_xg: number | null;
  status: string;
  venue: string | null;
}

interface MatchListClientProps {
  matches: Match[];
  initialSeason: number;
}

const RESULT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Wins', value: 'W' },
  { label: 'Draws', value: 'D' },
  { label: 'Losses', value: 'L' },
];

const VENUE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Home', value: 'true' },
  { label: 'Away', value: 'false' },
];

export function MatchListClient({ matches: initialMatches, initialSeason }: MatchListClientProps) {
  const searchParams = useSearchParams();
  const season = Number(searchParams.get('season')) || initialSeason;

  const [resultFilter, setResultFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');

  const filters: MatchFilters = {
    season,
    result: resultFilter || undefined,
    home: venueFilter || undefined,
  };

  const { data: matches = [], isFetching } = useQuery<Match[]>({
    queryKey: ['matches', filters],
    queryFn: () => fetchMatches(filters),
    initialData: resultFilter === '' && venueFilter === '' ? initialMatches : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const finished = matches.filter((m) => m.status === 'finished');
  const upcoming = matches.filter((m) => m.status !== 'finished').reverse();

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {RESULT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setResultFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                resultFilter === f.value
                  ? 'bg-red/10 text-red border border-red/20'
                  : 'text-sws-400 hover:text-sws-200 border border-sws-700/30 hover:border-sws-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {VENUE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setVenueFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                venueFilter === f.value
                  ? 'bg-red/10 text-red border border-red/20'
                  : 'text-sws-400 hover:text-sws-200 border border-sws-700/30 hover:border-sws-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {isFetching && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 border border-red/40 border-t-red rounded-full animate-spin" />
            <span className="text-xs font-mono text-sws-500">Loading...</span>
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Upcoming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((m, i) => (
              <MatchCard
                key={m.id}
                id={m.id}
                date={m.date}
                homeTeam={m.home_team}
                awayTeam={m.away_team}
                homeTeamId={m.home_team_id}
                awayTeamId={m.away_team_id}
                homeScore={m.home_score}
                awayScore={m.away_score}
                homeXg={m.home_xg ?? undefined}
                awayXg={m.away_xg ?? undefined}
                status={m.status}
                venue={m.venue ?? undefined}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">
        Results ({finished.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {finished.map((m, i) => (
          <MatchCard
            key={m.id}
            id={m.id}
            date={m.date}
            homeTeam={m.home_team}
            awayTeam={m.away_team}
            homeScore={m.home_score}
            awayScore={m.away_score}
            homeXg={m.home_xg ?? undefined}
            awayXg={m.away_xg ?? undefined}
            status={m.status}
            venue={m.venue ?? undefined}
            index={i}
          />
        ))}
      </div>

      {!matches.length && !isFetching && (
        <div className="text-center py-16 text-sws-500 font-mono text-sm">
          No matches found for the selected filters.
        </div>
      )}
    </div>
  );
}
