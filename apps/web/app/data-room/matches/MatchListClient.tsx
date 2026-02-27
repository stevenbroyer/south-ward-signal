'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MatchCard } from '@/components/data/MatchCard';

interface Match {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  home_xg: number | null;
  away_xg: number | null;
  status: string;
  venue: string | null;
}

interface MatchListClientProps {
  matches: Match[];
  currentFilters: { result?: string; home?: boolean };
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

export function MatchListClient({ matches, currentFilters }: MatchListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const finished = matches.filter((m) => m.status === 'finished');
  const upcoming = matches.filter((m) => m.status !== 'finished');

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {RESULT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter('result', f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                (currentFilters.result || '') === f.value
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
              onClick={() => setFilter('home', f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                String(currentFilters.home ?? '') === f.value
                  ? 'bg-red/10 text-red border border-red/20'
                  : 'text-sws-400 hover:text-sws-200 border border-sws-700/30 hover:border-sws-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
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

      {!matches.length && (
        <div className="text-center py-16 text-sws-500 font-mono text-sm">
          No matches found for the selected filters.
        </div>
      )}
    </div>
  );
}
