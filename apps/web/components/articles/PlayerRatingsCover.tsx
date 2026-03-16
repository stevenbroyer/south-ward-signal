'use client';

import { extractTeamsFromTitle, MLS_TEAM_IDS, smLogoUrl } from '@/lib/image-urls';

interface PlayerRatingsCoverProps {
  title: string;
  className?: string;
}

export function PlayerRatingsCover({ title, className = '' }: PlayerRatingsCoverProps) {
  const teams = extractTeamsFromTitle(title);

  // Use RBNY as home team fallback
  const homeId = teams ? MLS_TEAM_IDS[teams[0]] : MLS_TEAM_IDS['Red Bull New York'];
  const awayId = teams ? MLS_TEAM_IDS[teams[1]] : null;

  if (!homeId) return null;

  return (
    <div className={`relative bg-bg-elevated flex items-center justify-center overflow-hidden ${className}`}>
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 bg-sws-white" style={{ left: `${(i + 1) * 11.1}%`, width: '1px' }} />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 bg-sws-white" style={{ top: `${(i + 1) * 20}%`, height: '1px' }} />
        ))}
      </div>

      {/* Red glow behind logos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-red/10 blur-3xl" />

      {/* Logos */}
      <div className="relative z-10 flex items-center gap-6 md:gap-10">
        <img
          src={smLogoUrl(homeId)}
          alt=""
          className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
        />
        {awayId && (
          <>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">Player</span>
              <span className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">Ratings</span>
            </div>
            <img
              src={smLogoUrl(awayId)}
              alt=""
              className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
            />
          </>
        )}
        {!awayId && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">Player</span>
            <span className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">Ratings</span>
          </div>
        )}
      </div>
    </div>
  );
}
