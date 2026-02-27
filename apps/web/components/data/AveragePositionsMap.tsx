'use client';

interface PlayerPosition {
  name: string;
  shirtNumber: number;
  x: number;
  y: number;
  isHome: boolean;
}

interface AveragePositionsMapProps {
  home?: PlayerPosition[];
  away?: PlayerPosition[];
  homeTeam?: string;
  awayTeam?: string;
  className?: string;
}

const SAMPLE_HOME: PlayerPosition[] = [
  { name: 'Coronel', shirtNumber: 1, x: 5, y: 50, isHome: true },
  { name: 'Tolkin', shirtNumber: 2, x: 25, y: 15, isHome: true },
  { name: 'Nealis', shirtNumber: 12, x: 22, y: 38, isHome: true },
  { name: 'Long', shirtNumber: 33, x: 22, y: 62, isHome: true },
  { name: 'Duncan', shirtNumber: 3, x: 25, y: 85, isHome: true },
  { name: 'Edelman', shirtNumber: 75, x: 42, y: 30, isHome: true },
  { name: 'Harper', shirtNumber: 23, x: 42, y: 70, isHome: true },
  { name: 'Luquinhas', shirtNumber: 10, x: 58, y: 25, isHome: true },
  { name: 'Morgan', shirtNumber: 7, x: 58, y: 50, isHome: true },
  { name: 'Manoel', shirtNumber: 17, x: 58, y: 75, isHome: true },
  { name: 'Vanzeir', shirtNumber: 9, x: 72, y: 50, isHome: true },
];

export function AveragePositionsMap({
  home = SAMPLE_HOME,
  away = [],
  homeTeam = 'Home',
  awayTeam = 'Away',
  className = '',
}: AveragePositionsMapProps) {
  const allPlayers = [
    ...home.map((p) => ({ ...p, isHome: true })),
    ...away.map((p) => ({ ...p, isHome: false })),
  ];

  // If only home data, show just home. If both, show both halves
  const showBothSides = away.length > 0;

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Average Positions</h3>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red inline-block" />
            {homeTeam}
          </span>
          {showBothSides && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sws-400 inline-block" />
              {awayTeam}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
        <svg
          viewBox="0 0 105 68"
          className="absolute inset-0 w-full h-full"
          style={{ background: '#1a3a1a' }}
        >
          {/* Pitch markings */}
          <rect x="0" y="0" width="105" height="68" fill="none" stroke="#2d5a2d" strokeWidth="0.3" />
          {/* Halfway line */}
          <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="#2d5a2d" strokeWidth="0.3" />
          {/* Center circle */}
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="#2d5a2d" strokeWidth="0.3" />
          <circle cx="52.5" cy="34" r="0.3" fill="#2d5a2d" />
          {/* Penalty areas */}
          <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="#2d5a2d" strokeWidth="0.3" />
          <rect x="88.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="#2d5a2d" strokeWidth="0.3" />
          {/* Goal areas */}
          <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="#2d5a2d" strokeWidth="0.3" />
          <rect x="99.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="#2d5a2d" strokeWidth="0.3" />

          {/* Player positions */}
          {allPlayers.map((p, i) => {
            // Scale x from 0-100 to pitch coordinates
            const px = (p.x / 100) * 105;
            // For away team, mirror the x position
            const finalX = p.isHome ? px : 105 - px;
            const py = (p.y / 100) * 68;

            return (
              <g key={`${p.name}-${i}`}>
                {/* Glow */}
                <circle
                  cx={finalX}
                  cy={py}
                  r="3"
                  fill={p.isHome ? '#ED1A3D' : '#6E6E7A'}
                  fillOpacity={0.15}
                />
                {/* Dot */}
                <circle
                  cx={finalX}
                  cy={py}
                  r="1.8"
                  fill={p.isHome ? '#ED1A3D' : '#8888A0'}
                  stroke={p.isHome ? '#ff4060' : '#aaaacc'}
                  strokeWidth="0.3"
                />
                {/* Shirt number */}
                <text
                  x={finalX}
                  y={py + 0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize="1.6"
                  fontWeight="bold"
                  fontFamily="var(--font-jetbrains), monospace"
                >
                  {p.shirtNumber}
                </text>
                {/* Name label */}
                <text
                  x={finalX}
                  y={py + 3.8}
                  textAnchor="middle"
                  fill="#ccc"
                  fontSize="1.4"
                  fontFamily="var(--font-jetbrains), monospace"
                >
                  {p.name.split(' ').pop()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
