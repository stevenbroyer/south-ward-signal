'use client';

import { motion } from 'framer-motion';

interface PlayerRating {
  player_name: string;
  team: string;
  position?: string;
  fotmob_rating?: number;
  goals?: number;
  assists?: number;
}

function ratingColor(rating: number | undefined): string {
  if (!rating) return 'bg-sws-700 text-sws-400';
  if (rating >= 8.0) return 'bg-success/20 text-success border-success/30';
  if (rating >= 7.0) return 'bg-success/10 text-success/70 border-success/20';
  if (rating >= 6.5) return 'bg-gold/10 text-gold border-gold/20';
  if (rating >= 6.0) return 'bg-sws-700/50 text-sws-300 border-sws-600';
  return 'bg-red/10 text-red border-red/20';
}

interface PlayerRatingGridProps {
  players?: PlayerRating[];
  homeTeam?: string;
  awayTeam?: string;
  className?: string;
}

export function PlayerRatingGrid({
  players = [],
  homeTeam = 'Home',
  awayTeam = 'Away',
  className = '',
}: PlayerRatingGridProps) {
  if (!players.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Player Ratings</h3>
        <p className="text-sm font-mono text-sws-500">No ratings available</p>
      </div>
    );
  }

  const homePlayers = players.filter((p) => p.team === homeTeam).sort((a, b) => (b.fotmob_rating ?? 0) - (a.fotmob_rating ?? 0));
  const awayPlayers = players.filter((p) => p.team === awayTeam).sort((a, b) => (b.fotmob_rating ?? 0) - (a.fotmob_rating ?? 0));

  const renderTeam = (teamPlayers: PlayerRating[], teamName: string) => (
    <div>
      <p className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-3">{teamName}</p>
      <div className="space-y-1.5">
        {teamPlayers.map((p, i) => (
          <motion.div
            key={p.player_name}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <span className={`inline-flex items-center justify-center w-9 h-7 rounded text-xs font-mono font-bold border ${ratingColor(p.fotmob_rating ?? undefined)}`}>
              {p.fotmob_rating ? Number(p.fotmob_rating).toFixed(1) : '—'}
            </span>
            <span className="text-sm text-sws-300 flex-1 truncate">{p.player_name}</span>
            <span className="text-[10px] font-mono text-sws-500">{p.position}</span>
            {(p.goals ?? 0) > 0 && <span className="text-[10px] font-mono text-sws-400">⚽{p.goals}</span>}
            {(p.assists ?? 0) > 0 && <span className="text-[10px] font-mono text-sws-400">🅰️{p.assists}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <h3 className="font-display font-bold text-lg text-sws-white mb-4">Player Ratings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderTeam(homePlayers, homeTeam)}
        {renderTeam(awayPlayers, awayTeam)}
      </div>
    </div>
  );
}
