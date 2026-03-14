'use client';

import { motion } from 'motion/react';

interface Shot {
  x: number; // 0-100 (percentage of half-pitch width)
  y: number; // 0-100 (percentage of half-pitch height)
  xg: number;
  outcome: 'goal' | 'saved' | 'blocked' | 'off_target';
  player?: string;
}


const outcomeColor: Record<Shot['outcome'], string> = {
  goal: '#ED1A3D',
  saved: '#6E6E7A',
  blocked: '#2A2A32',
  off_target: '#44444F',
};

interface ShotMapProps {
  shots?: Shot[];
  className?: string;
}

export function ShotMap({ shots = [], className = '' }: ShotMapProps) {
  if (!shots.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Shot Map</h3>
        <div className="h-[280px] flex items-center justify-center text-sws-500 text-sm font-mono">
          Shot location data not available
        </div>
      </div>
    );
  }
  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-sws-white">Shot Map</h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-sws-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red inline-block" /> Goal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sws-400 inline-block" /> Saved</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sws-600 inline-block" /> Blocked</span>
        </div>
      </div>

      <div className="relative w-full" style={{ paddingBottom: '70%' }}>
        <svg
          viewBox="0 0 680 476"
          className="absolute inset-0 w-full h-full"
          fill="none"
        >
          {/* Pitch background */}
          <rect x="0" y="0" width="680" height="476" rx="4" fill="#111114" stroke="#2A2A32" strokeWidth="1" />

          {/* Half pitch outline */}
          <rect x="40" y="20" width="600" height="436" stroke="#1E1E24" strokeWidth="1.5" fill="none" />

          {/* Goal */}
          <rect x="275" y="20" width="130" height="4" fill="#2A2A32" />

          {/* 6-yard box */}
          <rect x="235" y="20" width="210" height="60" stroke="#1E1E24" strokeWidth="1" fill="none" />

          {/* 18-yard box */}
          <rect x="145" y="20" width="390" height="160" stroke="#1E1E24" strokeWidth="1" fill="none" />

          {/* Penalty spot */}
          <circle cx="340" cy="136" r="3" fill="#2A2A32" />

          {/* Penalty arc */}
          <path d="M 235 180 Q 340 230 445 180" stroke="#1E1E24" strokeWidth="1" fill="none" />

          {/* Center line */}
          <line x1="40" y1="456" x2="640" y2="456" stroke="#1E1E24" strokeWidth="1" />

          {/* Subtle grid */}
          {[160, 280, 400, 520].map(x => (
            <line key={`v${x}`} x1={x} y1="20" x2={x} y2="456" stroke="#1E1E24" strokeWidth="0.3" strokeDasharray="4 4" />
          ))}
          {[120, 220, 320].map(y => (
            <line key={`h${y}`} x1="40" y1={y} x2="640" y2={y} stroke="#1E1E24" strokeWidth="0.3" strokeDasharray="4 4" />
          ))}

          {/* Shots */}
          {shots.map((shot, i) => {
            const cx = 40 + (shot.x / 100) * 600;
            const cy = 20 + (shot.y / 100) * 436;
            const r = Math.max(5, Math.min(18, shot.xg * 30));
            return (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill={outcomeColor[shot.outcome]}
                fillOpacity={shot.outcome === 'goal' ? 0.9 : 0.5}
                stroke={shot.outcome === 'goal' ? '#ED1A3D' : 'transparent'}
                strokeWidth={shot.outcome === 'goal' ? 2 : 0}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <title>{shot.player} — xG: {shot.xg.toFixed(2)} ({shot.outcome})</title>
              </motion.circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
