'use client';

import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { HeroStats } from './HeroStats';

const SoccerScene = dynamic(
  () => import('../three/SoccerScene').then((mod) => mod.SoccerScene),
  {
    ssr: false,
    loading: () => <HeroFallback />,
  }
);

/* ── CSS smoke fallback shown while Three.js loads ── */
function HeroFallback() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 smoke-layer-1" />
      <div className="absolute inset-0 smoke-layer-2" />
      <div className="absolute inset-0 smoke-layer-3" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(237,26,61,0.25) 0%, rgba(237,26,61,0.08) 40%, transparent 70%)',
        }}
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ── Background layers ── */}
      <div className="absolute inset-0 z-0">
        {/* Base dark */}
        <div className="absolute inset-0 bg-bg pointer-events-none" />

        {/* Three.js scene (includes smoke plumes) */}
        <SoccerScene />

        {/* Noise / grain texture for grit */}
        <div className="absolute inset-0 z-[2] noise-overlay pointer-events-none" />

        {/* Scanlines for that broadcast / terrace cam feel */}
        <div className="absolute inset-0 z-[2] scanlines pointer-events-none" />

        {/* Bottom fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-60 z-[3] bg-gradient-to-t from-bg via-bg/80 to-transparent pointer-events-none" />
      </div>

      {/* ── Content scrim ── */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(10,10,12,0.7) 0%, rgba(10,10,12,0.3) 40%, transparent 70%)' }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-container mx-auto px-6 pb-24 pt-16 w-full pointer-events-none">
        <div className="max-w-3xl pointer-events-auto">
          {/* ── Main Headline ── */}
          <div className="mb-8">
            <motion.h1
              className="font-display font-black leading-[0.95] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
              style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block text-sws-white">Red</span>
              <span className="block text-sws-white">Runs</span>
              <span className="block text-gradient pb-[0.15em]">Deep.</span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-sws-200 font-light leading-relaxed max-w-md mb-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Independent RBNY coverage. Supporter-born. Data-driven.
          </motion.p>

          <motion.p
            className="text-sm text-sws-400 font-mono mb-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            Match recaps, commentary, player ratings, and advanced analytics. From the South Ward to your screen.
          </motion.p>

          {/* Season Stats + Next Match */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroStats />
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
      >
        <span className="text-[9px] font-mono text-sws-500 uppercase tracking-[0.3em]">Scroll</span>
        <motion.div
          className="w-[1px] h-8 bg-gradient-to-b from-red/60 to-transparent"
          animate={{ scaleY: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
