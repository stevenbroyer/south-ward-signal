'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchPlayers, type PlayerFilters } from '@/lib/data-room-api';
import { PlayerStatsTable } from '@/components/data/PlayerStatsTable';

interface Player {
  name: string;
  position: string;
  games_played: number;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  goals_added: number | null;
  key_passes: number | null;
  pass_completion: number | null;
  image_url?: string;
}

interface PlayersClientProps {
  players: Player[];
  initialSeason: number;
}

const POSITION_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'FW', value: 'FW' },
  { label: 'MF', value: 'MF' },
  { label: 'DF', value: 'DF' },
  { label: 'GK', value: 'GK' },
];

export function PlayersClient({ players: initialPlayers, initialSeason }: PlayersClientProps) {
  const searchParams = useSearchParams();
  const season = Number(searchParams.get('season')) || initialSeason;

  const [positionFilter, setPositionFilter] = useState('all');

  const filters: PlayerFilters = {
    season,
    position: positionFilter,
  };

  const { data: players = [], isFetching } = useQuery<Player[]>({
    queryKey: ['players', filters],
    queryFn: () => fetchPlayers(filters),
    initialData: positionFilter === 'all' ? initialPlayers : undefined,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest">
            Squad ({players.length} players)
          </h2>

          {/* Position filter pills */}
          <div className="flex gap-1">
            {POSITION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setPositionFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  positionFilter === f.value
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-red/40 border-t-red rounded-full animate-spin" />
              <span className="text-xs font-mono text-sws-500">Loading...</span>
            </div>
          )}
        </div>

        <Link
          href="/data-room/players/compare"
          className="text-xs font-mono text-red hover:text-red/80 transition-colors"
        >
          Compare Players →
        </Link>
      </div>

      <PlayerStatsTable players={players} />
    </div>
  );
}
