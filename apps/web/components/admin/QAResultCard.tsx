'use client';

import { AdminCard } from './AdminCard';

interface QAResult {
  score?: number;
  checks?: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
  bannedPhrases?: string[];
  readability?: number;
  [key: string]: unknown;
}

interface QAResultCardProps {
  qaResult: QAResult | null;
  qaPassed: boolean | null;
}

export function QAResultCard({ qaResult, qaPassed }: QAResultCardProps) {
  if (!qaResult || qaPassed === null) {
    return (
      <AdminCard title="QA Results">
        <div className="p-5 text-sws-400 text-sm">No QA data available</div>
      </AdminCard>
    );
  }

  const checks = qaResult.checks ?? [];

  return (
    <AdminCard title="QA Results">
      <div className="p-5 space-y-4">
        {/* Overall status */}
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${qaPassed ? 'text-success' : 'text-red'}`}>
            {qaPassed ? 'PASSED' : 'FAILED'}
          </span>
          {qaResult.score !== undefined && (
            <span className="text-sws-400 text-sm font-mono">Score: {qaResult.score}/100</span>
          )}
        </div>

        {/* Individual checks */}
        {checks.length > 0 && (
          <div className="space-y-2">
            {checks.map((check, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={check.passed ? 'text-success' : 'text-red'}>
                  {check.passed ? '\u2713' : '\u2717'}
                </span>
                <div>
                  <span className="text-sws-white">{check.name}</span>
                  {check.message && (
                    <p className="text-sws-400 text-xs mt-0.5">{check.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banned phrases */}
        {qaResult.bannedPhrases && qaResult.bannedPhrases.length > 0 && (
          <div>
            <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-1.5">Banned Phrases Found</p>
            <div className="flex flex-wrap gap-1.5">
              {qaResult.bannedPhrases.map((phrase, i) => (
                <span key={i} className="text-xs bg-red/10 text-red border border-red/30 rounded px-2 py-0.5 font-mono">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Readability */}
        {qaResult.readability !== undefined && (
          <div>
            <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-0.5">Readability Score</p>
            <p className="text-sws-white font-mono">{qaResult.readability}</p>
          </div>
        )}
      </div>
    </AdminCard>
  );
}
