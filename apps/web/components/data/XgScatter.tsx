'use client';

interface TeamXg {
  team: string;
  xgFor: number;
  xgAgainst: number;
  goalsAdded: number;
  points: number;
  gamesPlayed: number;
}

interface XgScatterProps {
  data?: TeamXg[];
  highlightTeam?: string;
  className?: string;
}

export function XgScatter({ data = [], highlightTeam = 'New York Red Bulls', className = '' }: XgScatterProps) {
  if (!data.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">xG Landscape</h3>
        <div className="h-[400px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No data available
        </div>
      </div>
    );
  }

  // Chart dimensions
  const W = 600;
  const H = 400;
  const PAD = 50;

  const xVals = data.map((d) => d.xgFor / Math.max(d.gamesPlayed, 1));
  const yVals = data.map((d) => d.xgAgainst / Math.max(d.gamesPlayed, 1));
  const xMin = Math.floor(Math.min(...xVals) * 10) / 10 - 0.1;
  const xMax = Math.ceil(Math.max(...xVals) * 10) / 10 + 0.1;
  const yMin = Math.floor(Math.min(...yVals) * 10) / 10 - 0.1;
  const yMax = Math.ceil(Math.max(...yVals) * 10) / 10 + 0.1;

  const scaleX = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const scaleY = (v: number) => PAD + ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const midX = scaleX((xMin + xMax) / 2);
  const midY = scaleY((yMin + yMax) / 2);

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">xG Landscape</h3>
        <span className="text-[10px] font-mono text-sws-500">Per game averages</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 400 }}>
        {/* Quadrant backgrounds */}
        <rect x={midX} y={PAD} width={W - PAD - midX} height={midY - PAD} fill="#22C55E" fillOpacity={0.03} />
        <rect x={PAD} y={PAD} width={midX - PAD} height={midY - PAD} fill="#6E6E7A" fillOpacity={0.03} />
        <rect x={PAD} y={midY} width={midX - PAD} height={H - PAD - midY} fill="#ED1A3D" fillOpacity={0.03} />
        <rect x={midX} y={midY} width={W - PAD - midX} height={H - PAD - midY} fill="#D4A843" fillOpacity={0.03} />

        {/* Axes */}
        <line x1={PAD} y1={midY} x2={W - PAD} y2={midY} stroke="#2A2A32" strokeDasharray="4 4" />
        <line x1={midX} y1={PAD} x2={midX} y2={H - PAD} stroke="#2A2A32" strokeDasharray="4 4" />

        {/* Quadrant labels */}
        <text x={W - PAD - 5} y={PAD + 15} textAnchor="end" fill="#22C55E" fontSize="9" fontFamily="var(--font-jetbrains)" opacity={0.5}>ELITE</text>
        <text x={PAD + 5} y={PAD + 15} textAnchor="start" fill="#6E6E7A" fontSize="9" fontFamily="var(--font-jetbrains)" opacity={0.5}>DEFENSIVE</text>
        <text x={PAD + 5} y={H - PAD - 5} textAnchor="start" fill="#ED1A3D" fontSize="9" fontFamily="var(--font-jetbrains)" opacity={0.5}>STRUGGLING</text>
        <text x={W - PAD - 5} y={H - PAD - 5} textAnchor="end" fill="#D4A843" fontSize="9" fontFamily="var(--font-jetbrains)" opacity={0.5}>OFFENSIVE</text>

        {/* Axis labels */}
        <text x={W / 2} y={H - 5} textAnchor="middle" fill="#44444F" fontSize="10" fontFamily="var(--font-jetbrains)">
          xG For / Game →
        </text>
        <text x={10} y={H / 2} textAnchor="middle" fill="#44444F" fontSize="10" fontFamily="var(--font-jetbrains)" transform={`rotate(-90, 10, ${H / 2})`}>
          ← xG Against / Game
        </text>

        {/* Data points */}
        {data.map((team) => {
          const xPg = team.xgFor / Math.max(team.gamesPlayed, 1);
          const yPg = team.xgAgainst / Math.max(team.gamesPlayed, 1);
          const cx = scaleX(xPg);
          const cy = scaleY(yPg);
          const isHighlighted = team.team === highlightTeam;

          return (
            <g key={team.team}>
              <circle
                cx={cx}
                cy={cy}
                r={isHighlighted ? 8 : 5}
                fill={isHighlighted ? '#ED1A3D' : '#44444F'}
                fillOpacity={isHighlighted ? 0.9 : 0.5}
                stroke={isHighlighted ? '#ED1A3D' : 'transparent'}
                strokeWidth={isHighlighted ? 2 : 0}
              />
              {isHighlighted && (
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#ED1A3D"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="var(--font-jetbrains)"
                >
                  NYRB
                </text>
              )}
              <title>{team.team} — xGF/g: {xPg.toFixed(2)} xGA/g: {yPg.toFixed(2)}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
