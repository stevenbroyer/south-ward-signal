'use client';

interface Shot {
  x: number;
  y: number;
  xg: number;
  outcome: string;
}

// Divide the half-pitch into zones
const ZONES = [
  { id: 'box-center', label: 'Central Box', xMin: 30, xMax: 70, yMin: 0, yMax: 35 },
  { id: 'box-left', label: 'Left Box', xMin: 0, xMax: 30, yMin: 0, yMax: 35 },
  { id: 'box-right', label: 'Right Box', xMin: 70, xMax: 100, yMin: 0, yMax: 35 },
  { id: 'edge', label: 'Edge of Box', xMin: 15, xMax: 85, yMin: 35, yMax: 55 },
  { id: 'mid-left', label: 'Left Channel', xMin: 0, xMax: 30, yMin: 35, yMax: 70 },
  { id: 'mid-right', label: 'Right Channel', xMin: 70, xMax: 100, yMin: 35, yMax: 70 },
  { id: 'long', label: 'Long Range', xMin: 15, xMax: 85, yMin: 55, yMax: 100 },
];

function intensityColor(ratio: number): string {
  if (ratio > 0.7) return '#ED1A3D';
  if (ratio > 0.5) return '#FF4D6A';
  if (ratio > 0.3) return '#D4A843';
  if (ratio > 0.15) return '#44444F';
  return '#2A2A32';
}

interface ShotZoneHeatmapProps {
  shots?: Shot[];
  className?: string;
}

export function ShotZoneHeatmap({ shots = [], className = '' }: ShotZoneHeatmapProps) {
  if (!shots.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Shot Zones</h3>
        <div className="h-[300px] flex items-center justify-center text-sws-500 text-sm font-mono">
          No shot data available
        </div>
      </div>
    );
  }

  // Categorize shots into zones
  const totalShots = shots.length;
  const zoneData = ZONES.map((zone) => {
    const zoneShots = shots.filter(
      (s) => s.x >= zone.xMin && s.x < zone.xMax && s.y >= zone.yMin && s.y < zone.yMax
    );
    const goals = zoneShots.filter((s) => s.outcome === 'goal').length;
    const avgXg = zoneShots.length ? zoneShots.reduce((sum, s) => sum + s.xg, 0) / zoneShots.length : 0;
    return {
      ...zone,
      shots: zoneShots.length,
      goals,
      avgXg,
      ratio: zoneShots.length / Math.max(totalShots, 1),
    };
  });

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <h3 className="font-display font-bold text-lg text-sws-white mb-4">Shot Zones</h3>

      <div className="relative w-full" style={{ paddingBottom: '70%' }}>
        <svg viewBox="0 0 680 476" className="absolute inset-0 w-full h-full" fill="none">
          {/* Pitch background */}
          <rect x="0" y="0" width="680" height="476" rx="4" fill="#111114" stroke="#2A2A32" strokeWidth="1" />
          <rect x="40" y="20" width="600" height="436" stroke="#1E1E24" strokeWidth="1.5" fill="none" />

          {/* Goal */}
          <rect x="275" y="20" width="130" height="4" fill="#2A2A32" />
          {/* 6-yard box */}
          <rect x="235" y="20" width="210" height="60" stroke="#1E1E24" strokeWidth="1" fill="none" />
          {/* 18-yard box */}
          <rect x="145" y="20" width="390" height="160" stroke="#1E1E24" strokeWidth="1" fill="none" />
          {/* Penalty spot */}
          <circle cx="340" cy="136" r="3" fill="#2A2A32" />

          {/* Zone heatmap overlays */}
          {zoneData.map((zone) => {
            const x = 40 + (zone.xMin / 100) * 600;
            const y = 20 + (zone.yMin / 100) * 436;
            const w = ((zone.xMax - zone.xMin) / 100) * 600;
            const h = ((zone.yMax - zone.yMin) / 100) * 436;
            const color = intensityColor(zone.ratio);

            return (
              <g key={zone.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={color}
                  fillOpacity={0.3}
                  stroke="#1E1E24"
                  strokeWidth="0.5"
                />
                {zone.shots > 0 && (
                  <>
                    <text
                      x={x + w / 2}
                      y={y + h / 2 - 6}
                      textAnchor="middle"
                      fill="#F5F5F7"
                      fontSize="13"
                      fontFamily="var(--font-jetbrains)"
                      fontWeight="bold"
                    >
                      {zone.shots}
                    </text>
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 10}
                      textAnchor="middle"
                      fill="#6E6E7A"
                      fontSize="9"
                      fontFamily="var(--font-jetbrains)"
                    >
                      {zone.goals}G · {zone.avgXg.toFixed(2)} xG
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[10px] font-mono text-sws-500 text-center mt-2">
        {totalShots} total shots · Brighter = more shots from zone
      </p>
    </div>
  );
}
