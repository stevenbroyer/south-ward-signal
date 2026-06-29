'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { MatchDayContext } from '@/lib/match-day';

interface MatchDayBannerProps {
  context: MatchDayContext;
}

/* ── PRE_MATCH ── */
function PreMatchBanner({ context }: MatchDayBannerProps) {
  const { match, hoursOffset } = context;
  if (!match) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-red/30 bg-bg-card/80 backdrop-blur animate-pulse-border">
      {/* Pulsing red accent top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent animate-glow-pulse" />

      <div className="px-6 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          {/* Label */}
          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
            </span>
            <span className="text-[11px] font-mono text-red uppercase tracking-[0.25em] font-bold">
              Match Day
            </span>
          </div>

          {/* Teams */}
          <h3 className="text-xl md:text-2xl font-display font-black text-sws-white mb-2">
            {match.homeTeam}{' '}
            <span className="text-sws-400 font-light">vs</span>{' '}
            {match.awayTeam}
          </h3>

          {/* Kickoff countdown */}
          <p className="text-sm font-mono text-sws-300 mb-1">
            Kickoff in{' '}
            <span className="text-red font-bold">
              {hoursOffset === 1 ? '1 hour' : `${hoursOffset} hours`}
            </span>
          </p>

          {/* Venue & competition */}
          <p className="text-xs font-mono text-sws-500">
            {match.venue} &middot; {match.competition}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/articles"
            className="px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-sws-white bg-red/10 border border-red/30 rounded hover:bg-red/20 hover:border-red/50 transition-all duration-300"
          >
            Preview
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── LIVE ── */
function LiveBanner({ context }: MatchDayBannerProps) {
  const { match } = context;
  if (!match) return null;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-red/40 bg-bg-card/80 backdrop-blur"
      style={{ boxShadow: '0 0 30px rgba(237,26,61,0.15)' }}
    >
      {/* Animated red glow border */}
      <div className="absolute inset-0 rounded-lg pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent animate-glow-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red/50 to-transparent animate-glow-pulse" />
      </div>

      <div className="px-6 py-6 md:py-8">
        {/* LIVE label */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red" />
          </span>
          <span className="text-xs font-mono text-red uppercase tracking-[0.3em] font-bold">
            Live
          </span>
          {match.statusDetail && (
            <span className="text-xs font-mono text-sws-400">{match.statusDetail}</span>
          )}
        </div>

        {/* Score display */}
        <Link
          href={`/data-room/matches/${match.id}`}
          className="group block text-center"
        >
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <span className="text-lg md:text-xl font-display font-bold text-sws-white text-right flex-1">
              {match.homeTeam}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-display font-black text-sws-white">
                {match.homeScore ?? 0}
              </span>
              <span className="text-xl md:text-2xl font-mono text-sws-500">-</span>
              <span className="text-4xl md:text-5xl font-display font-black text-sws-white">
                {match.awayScore ?? 0}
              </span>
            </div>
            <span className="text-lg md:text-xl font-display font-bold text-sws-white text-left flex-1">
              {match.awayTeam}
            </span>
          </div>
          <p className="text-[10px] font-mono text-sws-500 mt-3 group-hover:text-sws-400 transition-colors">
            Tap for live match stats &rarr;
          </p>
        </Link>
      </div>
    </div>
  );
}

/* ── POST_MATCH ── */
function PostMatchBanner({ context }: MatchDayBannerProps) {
  const { match } = context;
  if (!match) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-sws-600/30 bg-bg-card/80 backdrop-blur">
      <div className="px-6 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          {/* FINAL label */}
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-sws-400" />
            <span className="text-[11px] font-mono text-sws-400 uppercase tracking-[0.25em] font-bold">
              Final
            </span>
          </div>

          {/* Score */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-lg font-display font-bold text-sws-white">
              {match.homeTeam}
            </span>
            <span className="text-2xl md:text-3xl font-display font-black text-sws-white">
              {match.homeScore ?? 0}
            </span>
            <span className="text-lg font-mono text-sws-500">-</span>
            <span className="text-2xl md:text-3xl font-display font-black text-sws-white">
              {match.awayScore ?? 0}
            </span>
            <span className="text-lg font-display font-bold text-sws-white">
              {match.awayTeam}
            </span>
          </div>

          <p className="text-xs font-mono text-sws-500">
            {match.competition}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/data-room/matches/${match.id}`}
            className="px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-sws-white bg-red/10 border border-red/30 rounded hover:bg-red/20 hover:border-red/50 transition-all duration-300"
          >
            Full Match Stats
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Main Export ──
   Mounts on every homepage load and polls /api/match-live (ESPN real-time) so
   the banner reflects LIVE scores without waiting for the 3-hour DB sync.
   Cadence adapts: ~25s while LIVE, 60s around a match, 5 min otherwise. */
export function MatchDayBanner({ context }: MatchDayBannerProps) {
  const [ctx, setCtx] = useState<MatchDayContext>(context);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (state?: string) => {
      if (cancelled) return;
      const delay =
        state === 'LIVE' ? 25_000 : state === 'PRE_MATCH' || state === 'POST_MATCH' ? 60_000 : 300_000;
      timer = setTimeout(tick, delay);
    };

    async function tick() {
      try {
        const res = await fetch('/api/match-live', { cache: 'no-store' });
        if (!cancelled && res.ok) {
          const data = (await res.json()) as MatchDayContext;
          if (data?.state) setCtx(data);
          schedule(data?.state);
          return;
        }
      } catch {
        /* network hiccup — just retry on the slow cadence */
      }
      schedule('OFF_DAY');
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (ctx.state === 'OFF_DAY') return null;

  return (
    <section className="relative -mt-16 z-20 pb-4">
      <motion.div
        className="max-w-container mx-auto px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {ctx.state === 'PRE_MATCH' && <PreMatchBanner context={ctx} />}
        {ctx.state === 'LIVE' && <LiveBanner context={ctx} />}
        {ctx.state === 'POST_MATCH' && <PostMatchBanner context={ctx} />}
      </motion.div>
    </section>
  );
}
