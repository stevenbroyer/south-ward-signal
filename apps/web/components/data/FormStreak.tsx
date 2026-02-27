'use client';

import { motion } from 'framer-motion';

interface FormMatch {
  match_id?: string;
  match_date?: string;
  opponent: string;
  is_home: boolean;
  result: string;
  goals_for: number;
  goals_against: number;
}

const RESULT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  W: { bg: 'bg-success/15', border: 'border-success/30', text: 'text-success' },
  D: { bg: 'bg-gold/15', border: 'border-gold/30', text: 'text-gold' },
  L: { bg: 'bg-red/15', border: 'border-red/30', text: 'text-red' },
};

interface FormStreakProps {
  matches?: FormMatch[];
  className?: string;
}

export function FormStreak({ matches = [], className = '' }: FormStreakProps) {
  if (!matches.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Form</h3>
        <div className="h-20 flex items-center justify-center text-sws-500 text-sm font-mono">
          No matches yet
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Form</h3>
        <span className="text-xs font-mono text-sws-500">Last {matches.length} matches</span>
      </div>

      <div className="flex gap-2">
        {matches.map((m, i) => {
          const colors = RESULT_COLORS[m.result] || RESULT_COLORS.D;
          return (
            <motion.div
              key={m.match_id || i}
              className={`flex-1 ${colors.bg} ${colors.border} border rounded-lg p-2 text-center min-w-0`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <p className={`text-lg font-mono font-bold ${colors.text}`}>
                {m.result}
              </p>
              <p className="text-[10px] font-mono text-sws-400 truncate">
                {m.goals_for}-{m.goals_against}
              </p>
              <p className="text-[9px] font-mono text-sws-500 truncate mt-0.5">
                {m.is_home ? 'v' : '@'} {m.opponent?.split(' ').pop()}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
