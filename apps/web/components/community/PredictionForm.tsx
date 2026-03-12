'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PredictionFormProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
}

export function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  matchDate,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mock: no auth for now
  const isLoggedIn = true;

  async function handleSubmit() {
    if (!isLoggedIn || submitted) return;
    setSubmitting(true);
    try {
      await fetch('/api/community/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore, awayScore }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Prediction submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function clamp(val: number) {
    return Math.max(0, Math.min(10, val));
  }

  return (
    <motion.div
      className={cn(
        'bg-bg-card border border-sws-600/30 rounded-lg p-6',
        'hover:border-red/40 transition-colors duration-300'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Match info */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">
          Score Prediction
        </p>
        <p className="text-[10px] font-mono text-sws-500">
          {matchDate}
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-red/60 via-red/20 to-transparent mb-6" />

      {submitted ? (
        <motion.div
          className="flex flex-col items-center justify-center py-8 gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-12 h-12 rounded-full bg-red/10 border border-red/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sws-white font-display font-bold text-lg">Prediction Locked</p>
          <p className="font-mono text-2xl text-sws-white">
            <span className="text-red">{homeScore}</span>
            <span className="text-sws-500 mx-2">-</span>
            <span className="text-red">{awayScore}</span>
          </p>
          <p className="text-sws-400 text-sm">
            {homeTeam} vs {awayTeam}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Score inputs */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {/* Home team */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <p className="text-sm text-sws-white font-display font-bold text-center truncate max-w-[140px]">
                {homeTeam}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHomeScore(clamp(homeScore - 1))}
                  className="w-8 h-8 rounded bg-bg-elevated border border-sws-600/30 text-sws-400 hover:text-sws-white hover:border-sws-500 transition-colors flex items-center justify-center font-mono text-lg"
                  aria-label="Decrease home score"
                >
                  -
                </button>
                <span className="font-mono text-4xl text-sws-white w-12 text-center tabular-nums">
                  {homeScore}
                </span>
                <button
                  type="button"
                  onClick={() => setHomeScore(clamp(homeScore + 1))}
                  className="w-8 h-8 rounded bg-bg-elevated border border-sws-600/30 text-sws-400 hover:text-sws-white hover:border-sws-500 transition-colors flex items-center justify-center font-mono text-lg"
                  aria-label="Increase home score"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-sws-500 font-mono text-xs uppercase">vs</span>
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <p className="text-sm text-sws-white font-display font-bold text-center truncate max-w-[140px]">
                {awayTeam}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAwayScore(clamp(awayScore - 1))}
                  className="w-8 h-8 rounded bg-bg-elevated border border-sws-600/30 text-sws-400 hover:text-sws-white hover:border-sws-500 transition-colors flex items-center justify-center font-mono text-lg"
                  aria-label="Decrease away score"
                >
                  -
                </button>
                <span className="font-mono text-4xl text-sws-white w-12 text-center tabular-nums">
                  {awayScore}
                </span>
                <button
                  type="button"
                  onClick={() => setAwayScore(clamp(awayScore + 1))}
                  className="w-8 h-8 rounded bg-bg-elevated border border-sws-600/30 text-sws-400 hover:text-sws-white hover:border-sws-500 transition-colors flex items-center justify-center font-mono text-lg"
                  aria-label="Increase away score"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          {isLoggedIn ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-red hover:bg-red/90 text-white font-display font-bold"
            >
              {submitting ? 'Submitting...' : 'Lock In Prediction'}
            </Button>
          ) : (
            <p className="text-center text-sws-400 text-sm font-mono">
              Sign in to predict
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
