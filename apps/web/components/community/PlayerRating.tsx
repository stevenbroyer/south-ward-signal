'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PlayerRatingProps {
  playerId: string;
  playerName: string;
  position: string;
  matchId: string;
}

export function PlayerRating({
  playerId,
  playerName,
  position,
  matchId,
}: PlayerRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleRate(rating: number) {
    if (submitted) return;
    setSelectedRating(rating);
    try {
      await fetch('/api/community/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, matchId, rating }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Rating submit failed:', err);
    }
  }

  function getRatingColor(rating: number) {
    if (rating >= 8) return 'text-success';
    if (rating >= 6) return 'text-sws-white';
    if (rating >= 4) return 'text-warning';
    return 'text-red';
  }

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-bg-card border border-sws-600/30 rounded-lg hover:border-sws-600/50 transition-colors">
      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-sws-white font-display font-bold truncate">
          {playerName}
        </p>
        <Badge
          variant="outline"
          className="mt-1 text-[10px] font-mono text-sws-400 border-sws-600/50 px-1.5 py-0"
        >
          {position}
        </Badge>
      </div>

      {/* Rating buttons */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
          <motion.button
            key={rating}
            type="button"
            onClick={() => handleRate(rating)}
            disabled={submitted}
            whileHover={!submitted ? { scale: 1.15 } : undefined}
            whileTap={!submitted ? { scale: 0.95 } : undefined}
            className={cn(
              'w-7 h-7 rounded text-xs font-mono font-bold transition-all duration-200',
              'flex items-center justify-center',
              selectedRating === rating
                ? 'bg-red text-white shadow-lg shadow-red/20'
                : submitted
                  ? 'bg-bg-elevated text-sws-600 cursor-default'
                  : 'bg-bg-elevated border border-sws-600/30 text-sws-400 hover:border-red/50 hover:text-sws-white cursor-pointer'
            )}
            aria-label={`Rate ${playerName} ${rating} out of 10`}
          >
            {rating}
          </motion.button>
        ))}
      </div>

      {/* Result */}
      {submitted && selectedRating !== null && (
        <motion.span
          className={cn('font-mono text-lg font-bold w-8 text-right', getRatingColor(selectedRating))}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {selectedRating}
        </motion.span>
      )}
    </div>
  );
}
