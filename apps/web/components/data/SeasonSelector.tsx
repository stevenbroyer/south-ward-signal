'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SeasonSelectorProps {
  seasons?: number[];
  currentSeason?: number;
}

const DEFAULT_SEASONS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

export function SeasonSelector({ seasons = DEFAULT_SEASONS, currentSeason }: SeasonSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = currentSeason || Number(searchParams.get('season')) || seasons[0];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('season', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="bg-bg-card border border-sws-700/50 rounded-lg px-3 py-2 text-sm font-mono text-sws-300 focus:outline-none focus:border-red/40 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236E6E7A%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center] pr-8"
    >
      {seasons.map((s) => (
        <option key={s} value={s}>
          {s} Season
        </option>
      ))}
    </select>
  );
}

export function getSeasonFromParams(searchParams: { season?: string }): number {
  return Number(searchParams?.season) || 2025;
}
