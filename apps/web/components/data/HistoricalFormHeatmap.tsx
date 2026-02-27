'use client';

interface MatchResult {
  season: number;
  match_date: string;
  result: string;
}

const RESULT_COLORS: Record<string, string> = {
  W: '#22C55E',
  D: '#D4A843',
  L: '#ED1A3D',
};

interface HistoricalFormHeatmapProps {
  data?: MatchResult[];
  className?: string;
}

export function HistoricalFormHeatmap({ data = [], className = '' }: HistoricalFormHeatmapProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Historical Form</h3>
        <div className="h-[200px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  // Group by season
  const seasons = [...new Set(data.map((d) => d.season))].sort((a, b) => a - b);
  const maxMatchweeks = Math.max(
    ...seasons.map((s) => data.filter((d) => d.season === s).length)
  );

  const grid = seasons.map((season) => {
    const matches = data.filter((d) => d.season === season);
    return { season, matches };
  });

  const cellSize = 14;
  const gap = 2;
  const labelW = 40;

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Historical Form</h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-sws-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: RESULT_COLORS.W }} />
            Win
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: RESULT_COLORS.D }} />
            Draw
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: RESULT_COLORS.L }} />
            Loss
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: labelW + maxMatchweeks * (cellSize + gap) }}>
          {grid.map(({ season, matches }) => (
            <div key={season} className="flex items-center mb-1">
              <span className="text-[10px] font-mono text-sws-500 w-10 shrink-0">{season}</span>
              <div className="flex gap-[2px]">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-sm"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: RESULT_COLORS[m.result] || '#2A2A32',
                      opacity: 0.7,
                    }}
                    title={`MW${i + 1}: ${m.result} (${new Date(m.match_date).toLocaleDateString()})`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
