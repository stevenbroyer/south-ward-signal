'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PollOption {
  label: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  results?: number[];
  userVoted?: number | null;
  expiresAt?: string;
}

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  const [voted, setVoted] = useState<number | null>(poll.userVoted ?? null);
  const [results, setResults] = useState<number[]>(poll.results ?? poll.options.map(() => 0));
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes);

  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;
  const showResults = voted !== null || isExpired;

  async function handleVote(optionIndex: number) {
    if (voted !== null || isExpired) return;

    // Optimistic update
    const newResults = [...results];
    newResults[optionIndex] = (newResults[optionIndex] || 0) + 1;
    setResults(newResults);
    setTotalVotes((prev) => prev + 1);
    setVoted(optionIndex);

    try {
      await fetch('/api/community/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, optionIndex }),
      });
    } catch (err) {
      console.error('Poll vote failed:', err);
    }
  }

  function getPercentage(votes: number) {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  }

  return (
    <motion.div
      className="bg-bg-card border border-sws-600/30 rounded-lg p-6 hover:border-sws-600/50 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">
          Community Poll
        </p>
        {isExpired && (
          <span className="text-[10px] font-mono text-sws-500 uppercase">Closed</span>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-red/60 via-red/20 to-transparent mb-4" />

      <h3 className="text-lg font-display font-bold text-sws-white mb-5">
        {poll.question}
      </h3>

      {/* Options */}
      <div className="space-y-2.5">
        {poll.options.map((option, index) => {
          const percentage = getPercentage(results[index] || 0);
          const isSelected = voted === index;

          return showResults ? (
            <motion.div
              key={index}
              className={cn(
                'relative rounded-md overflow-hidden border transition-colors',
                isSelected
                  ? 'border-red/50'
                  : 'border-sws-600/30'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {/* Background bar */}
              <motion.div
                className={cn(
                  'absolute inset-y-0 left-0',
                  isSelected ? 'bg-red/15' : 'bg-sws-600/15'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              />
              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red" />
                  )}
                  <span className={cn(
                    'text-sm',
                    isSelected ? 'text-sws-white font-medium' : 'text-sws-300'
                  )}>
                    {option.label}
                  </span>
                </div>
                <span className="font-mono text-sm text-sws-400 tabular-nums">
                  {percentage}%
                </span>
              </div>
            </motion.div>
          ) : (
            <button
              key={index}
              type="button"
              onClick={() => handleVote(index)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-md border border-sws-600/30',
                'bg-bg-elevated hover:border-red/40 hover:bg-bg-surface',
                'text-sm text-sws-300 hover:text-sws-white',
                'transition-all duration-200 cursor-pointer'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Vote count */}
      <p className="mt-4 text-[11px] font-mono text-sws-500">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        {poll.expiresAt && !isExpired && (
          <span className="ml-2">
            &middot; Closes {new Date(poll.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </p>
    </motion.div>
  );
}
