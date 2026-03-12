'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  totalPredictions: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return (
        <Badge className="bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30 font-mono text-xs px-1.5">
          1st
        </Badge>
      );
    case 2:
      return (
        <Badge className="bg-sws-300/10 text-sws-300 border-sws-300/30 font-mono text-xs px-1.5">
          2nd
        </Badge>
      );
    case 3:
      return (
        <Badge className="bg-[#CD7F32]/15 text-[#CD7F32] border-[#CD7F32]/30 font-mono text-xs px-1.5">
          3rd
        </Badge>
      );
    default:
      return (
        <span className="font-mono text-sm text-sws-400 tabular-nums pl-1">
          {rank}
        </span>
      );
  }
}

export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <motion.div
      className="bg-bg-card border border-sws-600/30 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-1">
          Prediction Competition
        </p>
        <div className="h-px bg-gradient-to-r from-red/60 via-red/20 to-transparent" />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-sws-600/30 hover:bg-transparent">
            <TableHead className="text-sws-500 font-mono text-[10px] uppercase tracking-wider w-16">
              Rank
            </TableHead>
            <TableHead className="text-sws-500 font-mono text-[10px] uppercase tracking-wider">
              User
            </TableHead>
            <TableHead className="text-sws-500 font-mono text-[10px] uppercase tracking-wider text-right">
              Points
            </TableHead>
            <TableHead className="text-sws-500 font-mono text-[10px] uppercase tracking-wider text-right hidden sm:table-cell">
              Exact
            </TableHead>
            <TableHead className="text-sws-500 font-mono text-[10px] uppercase tracking-wider text-right hidden sm:table-cell">
              Correct
            </TableHead>
            <TableHead className="text-sws-500 font-mono text-[10px] uppercase tracking-wider text-right hidden md:table-cell">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={entry.userId}
              className={cn(
                'border-sws-600/20',
                entry.rank <= 3 && 'bg-bg-elevated/50',
                'hover:bg-bg-surface/50'
              )}
            >
              <TableCell className="py-3">
                {getRankBadge(entry.rank)}
              </TableCell>
              <TableCell className="py-3">
                <span className={cn(
                  'text-sm font-display',
                  entry.rank <= 3 ? 'text-sws-white font-bold' : 'text-sws-300'
                )}>
                  {entry.displayName}
                </span>
              </TableCell>
              <TableCell className="py-3 text-right">
                <span className={cn(
                  'font-mono text-sm tabular-nums font-bold',
                  entry.rank === 1 ? 'text-[#D4A843]' : 'text-sws-white'
                )}>
                  {entry.totalPoints}
                </span>
              </TableCell>
              <TableCell className="py-3 text-right hidden sm:table-cell">
                <span className="font-mono text-sm text-sws-400 tabular-nums">
                  {entry.exactScores}
                </span>
              </TableCell>
              <TableCell className="py-3 text-right hidden sm:table-cell">
                <span className="font-mono text-sm text-sws-400 tabular-nums">
                  {entry.correctResults}
                </span>
              </TableCell>
              <TableCell className="py-3 text-right hidden md:table-cell">
                <span className="font-mono text-sm text-sws-400 tabular-nums">
                  {entry.totalPredictions}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {entries.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sws-400 text-sm">No predictions yet. Be the first!</p>
        </div>
      )}
    </motion.div>
  );
}
