'use client';

import { extractTeamsFromTitle, MLS_TEAM_IDS, smLogoUrl } from '@/lib/image-urls';

interface MatchRecapCoverProps {
  title: string;
  className?: string;
}

export function MatchRecapCover({ title, className = '' }: MatchRecapCoverProps) {
  const teams = extractTeamsFromTitle(title);
  if (!teams) return null;

  const [home, away] = teams;
  const homeId = MLS_TEAM_IDS[home];
  const awayId = MLS_TEAM_IDS[away];
  if (!homeId || !awayId) return null;

  return (
    <div className={`relative bg-bg-elevated flex items-center justify-center gap-8 md:gap-12 ${className}`}>
      {/* Subtle pitch line pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-sws-white" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-sws-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-sws-white" />
      </div>

      <img
        src={smLogoUrl(homeId)}
        alt={home}
        className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg relative z-10"
      />
      <span className="text-sws-500 font-mono text-sm md:text-base font-bold relative z-10">vs</span>
      <img
        src={smLogoUrl(awayId)}
        alt={away}
        className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg relative z-10"
      />
    </div>
  );
}
