'use client';

import { motion } from 'motion/react';

interface MatchEvent {
  type: string;
  time: number;
  overloadTime?: number;
  player?: { name: string };
  assistPlayer?: { name: string };
  isHome?: boolean;
  card?: string;
  swap?: Array<{ name: string }>;
}

const EVENT_ICONS: Record<string, string> = {
  Goal: '⚽',
  YellowCard: '🟨',
  RedCard: '🟥',
  Substitution: '🔄',
  Penalty: '⚽',
};

interface EventTimelineProps {
  events?: MatchEvent[];
  homeTeam?: string;
  awayTeam?: string;
  className?: string;
}

export function EventTimeline({
  events = [],
  homeTeam = 'Home',
  awayTeam = 'Away',
  className = '',
}: EventTimelineProps) {
  const displayEvents = events.filter((e) =>
    ['Goal', 'YellowCard', 'RedCard', 'Substitution'].includes(e.type)
  );

  if (!displayEvents.length) {
    return (
      <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
        <h3 className="font-display font-bold text-lg text-sws-white mb-4">Key Events</h3>
        <p className="text-sm font-mono text-sws-500">No events available</p>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl p-5 ${className}`}>
      <h3 className="font-display font-bold text-lg text-sws-white mb-4">Key Events</h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-sws-700/40" />

        <div className="space-y-3">
          {displayEvents.map((event, i) => {
            const isHome = event.isHome;
            const icon = EVENT_ICONS[event.type] || '•';
            const timeStr = event.overloadTime
              ? `${event.time}+${event.overloadTime}'`
              : `${event.time}'`;

            return (
              <motion.div
                key={i}
                className={`flex items-center gap-3 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
                initial={{ opacity: 0, x: isHome ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className={`flex-1 ${isHome ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-sws-300">
                    {event.player?.name}
                    {event.assistPlayer && (
                      <span className="text-sws-500 text-xs ml-1">({event.assistPlayer.name})</span>
                    )}
                    {event.type === 'Substitution' && event.swap?.[0] && (
                      <span className="text-sws-500 text-xs ml-1">→ {event.swap[0].name}</span>
                    )}
                  </p>
                </div>

                <div className="flex-shrink-0 w-16 text-center">
                  <span className="text-sm">{icon}</span>
                  <p className="text-[10px] font-mono text-sws-500">{timeStr}</p>
                </div>

                <div className="flex-1" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
