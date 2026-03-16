'use client';

import { isNYRB } from '@/lib/team-utils';

interface TeamXgData {
  team: string;
  team_id?: string;
  xg_for_per90?: number;
  xg_against_per90?: number;
  xgFor?: number;
  xgAgainst?: number;
  gamesPlayed?: number;
  is_rbny?: boolean;
  logo_url?: string | null;
}

interface XgScatterProps {
  data?: TeamXgData[];
  highlightTeam?: string;
  className?: string;
}

export function XgScatter({ data = [], highlightTeam = 'New York RB', className = '' }: XgScatterProps) {
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

  // Normalize data — handle both pre-computed per90 and raw totals
  const points = data.map((d) => {
    const xPg = d.xg_for_per90 ?? (d.xgFor != null ? d.xgFor / Math.max(d.gamesPlayed || 1, 1) : 0);
    const yPg = d.xg_against_per90 ?? (d.xgAgainst != null ? d.xgAgainst / Math.max(d.gamesPlayed || 1, 1) : 0);
    const isRbny = d.is_rbny || d.team === highlightTeam || isNYRB(d.team);
    return { team: d.team, xPg, yPg, isRbny };
  }).filter((p) => !isNaN(p.xPg) && !isNaN(p.yPg));

  if (!points.length) {
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

  const xVals = points.map((p) => p.xPg);
  const yVals = points.map((p) => p.yPg);
  const xMin = Math.floor(Math.min(...xVals) * 10) / 10 - 0.1;
  const xMax = Math.ceil(Math.max(...xVals) * 10) / 10 + 0.1;
  const yMin = Math.floor(Math.min(...yVals) * 10) / 10 - 0.1;
  const yMax = Math.ceil(Math.max(...yVals) * 10) / 10 + 0.1;

  const rangeX = xMax - xMin || 1;
  const rangeY = yMax - yMin || 1;
  const scaleX = (v: number) => PAD + ((v - xMin) / rangeX) * (W - 2 * PAD);
  const scaleY = (v: number) => PAD + ((v - yMin) / rangeY) * (H - 2 * PAD);

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
        {points.map((pt) => {
          const cx = scaleX(pt.xPg);
          const cy = scaleY(pt.yPg);

          return (
            <g key={pt.team} aria-label={`${pt.team}: xGF/g ${pt.xPg.toFixed(2)}, xGA/g ${pt.yPg.toFixed(2)}`}>
              <circle
                cx={cx}
                cy={cy}
                r={pt.isRbny ? 8 : 5}
                fill={pt.isRbny ? '#ED1A3D' : '#44444F'}
                fillOpacity={pt.isRbny ? 0.9 : 0.5}
                stroke={pt.isRbny ? '#ED1A3D' : 'transparent'}
                strokeWidth={pt.isRbny ? 2 : 0}
              />
              {pt.isRbny && (
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#ED1A3D"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="var(--font-jetbrains)"
                >
                  RBNY
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
