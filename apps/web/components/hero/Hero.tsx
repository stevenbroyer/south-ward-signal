'use client';

import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { HeroStats } from './HeroStats';
import { NewsletterForm } from './NewsletterForm';

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
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* ── Background layers ── */}
      <div className="absolute inset-0 z-0">
        {/* Base dark */}
        <div className="absolute inset-0 bg-bg" />

        {/* Three.js scene (replaces CSS smoke) */}
        <SoccerScene />

        {/* Noise / grain texture for grit */}
        <div className="absolute inset-0 z-[2] noise-overlay" />

        {/* Scanlines for that broadcast / terrace cam feel */}
        <div className="absolute inset-0 z-[2] scanlines" />

        {/* Bottom fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-60 z-[3] bg-gradient-to-t from-bg via-bg/80 to-transparent" />
      </div>

      {/* ── Vertical red stripe — like a scarf or tifo banner ── */}
      <motion.div
        className="absolute left-[7%] top-0 bottom-0 w-[3px] z-[1]"
        style={{ background: 'linear-gradient(180deg, transparent 0%, #ED1A3D 20%, #ED1A3D 80%, transparent 100%)' }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.3 }}
        transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-container mx-auto px-6 pb-20 pt-40 w-full">
        <div className="max-w-3xl">
          {/* Status badge */}
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
            </span>
            <span className="text-[11px] font-mono text-sws-400 uppercase tracking-[0.25em]">
              South Ward Signal
            </span>
            <span className="h-[1px] w-12 bg-sws-600" />
            <span className="text-[11px] font-mono text-sws-500 uppercase tracking-[0.2em]">
              Est. 2026
            </span>
          </motion.div>

          {/* ── Main Headline ── */}
          <div className="mb-8">
            <motion.h1
              className="font-display font-black leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block text-sws-white">Red</span>
              <span className="block text-sws-white">Runs</span>
              <span className="block text-gradient">Deep.</span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-sws-300 font-light leading-relaxed max-w-md mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Independent RBNY coverage. Supporter-born. Data-driven.
          </motion.p>

          <motion.p
            className="text-sm text-sws-500 font-mono mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            Match recaps, tactical breakdowns, and advanced analytics — from the South Ward to your screen.
          </motion.p>

          {/* Newsletter Form */}
          <motion.div
            className="mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            id="subscribe"
          >
            <NewsletterForm />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroStats />
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
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
