'use client';

import { displayName } from '@/lib/team-utils';

interface H2HResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
}

interface H2HComparisonProps {
  homeTeam?: string;
  awayTeam?: string;
  homeWins?: number;
  awayWins?: number;
  draws?: number;
  recentMatches?: H2HResult[];
  isNYRBHome?: boolean;
  className?: string;
}

const SAMPLE_MATCHES: H2HResult[] = [
  { homeTeam: 'NYRB', awayTeam: 'NYCFC', homeScore: 2, awayScore: 1, date: '2025-09-14' },
  { homeTeam: 'NYCFC', awayTeam: 'NYRB', homeScore: 0, awayScore: 0, date: '2025-06-21' },
  { homeTeam: 'NYRB', awayTeam: 'NYCFC', homeScore: 3, awayScore: 2, date: '2025-04-05' },
  { homeTeam: 'NYCFC', awayTeam: 'NYRB', homeScore: 1, awayScore: 2, date: '2024-09-28' },
  { homeTeam: 'NYRB', awayTeam: 'NYCFC', homeScore: 1, awayScore: 1, date: '2024-07-13' },
];

export function H2HComparison({
  homeTeam = 'RBNY',
  awayTeam = 'New York City FC',
  homeWins = 8,
  awayWins = 5,
  draws = 3,
  recentMatches = SAMPLE_MATCHES,
  isNYRBHome = true,
  className = '',
}: H2HComparisonProps) {
  const total = homeWins + awayWins + draws || 1;
  const homePct = (homeWins / total) * 100;
  const drawPct = (draws / total) * 100;
  const awayPct = (awayWins / total) * 100;

  const homeShort = displayName(homeTeam);
  const awayShort = displayName(awayTeam);

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <h3 className="font-display font-bold text-lg text-sws-white mb-4">Head to Head</h3>

      {/* Record Summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <p className={`text-2xl font-mono font-bold ${isNYRBHome ? 'text-red' : 'text-sws-300'}`}>{homeWins}</p>
          <p className="text-[10px] font-mono text-sws-500 uppercase">{homeShort}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-mono font-bold text-sws-400">{draws}</p>
          <p className="text-[10px] font-mono text-sws-500 uppercase">Draws</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-mono font-bold ${!isNYRBHome ? 'text-red' : 'text-sws-300'}`}>{awayWins}</p>
          <p className="text-[10px] font-mono text-sws-500 uppercase">{awayShort}</p>
        </div>
      </div>

      {/* Win bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-5">
        <div className={isNYRBHome ? 'bg-red' : 'bg-sws-300'} style={{ width: `${homePct}%` }} />
        <div className="bg-sws-500" style={{ width: `${drawPct}%` }} />
        <div className={!isNYRBHome ? 'bg-red' : 'bg-sws-300'} style={{ width: `${awayPct}%` }} />
      </div>

      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-2">Last {recentMatches.length} Meetings</p>
          <div className="space-y-1.5">
            {recentMatches.slice(0, 5).map((m, i) => {
              const isHomeWin = m.homeScore > m.awayScore;
              const isDraw = m.homeScore === m.awayScore;
              return (
                <div key={i} className="flex items-center justify-between text-xs font-mono py-1">
                  <span className="text-sws-500 w-20">
                    {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </span>
                  <span className={`flex-1 text-right ${isHomeWin ? 'text-sws-white' : 'text-sws-400'}`}>
                    {m.homeTeam}
                  </span>
                  <span className={`w-12 text-center font-bold ${isDraw ? 'text-gold' : ''}`}>
                    {m.homeScore} - {m.awayScore}
                  </span>
                  <span className={`flex-1 ${!isHomeWin && !isDraw ? 'text-sws-white' : 'text-sws-400'}`}>
                    {m.awayTeam}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
