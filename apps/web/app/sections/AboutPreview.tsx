'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import Link from 'next/link';

const coverageTypes = [
  { icon: '01', title: 'Match Recaps', desc: 'Full analysis within 60 minutes of the final whistle' },
  { icon: '02', title: 'Tactical Previews', desc: 'Key matchups, formation analysis, and predictions' },
  { icon: '03', title: 'Advanced Analytics', desc: 'xG, Goals Added, PPDA, and deep statistical dives' },
  { icon: '04', title: 'Transfer Intelligence', desc: 'Data-backed scouting reports on rumored targets' },
  { icon: '05', title: 'Visual Storytelling', desc: 'Shot maps, pass networks, and player radar charts' },
  { icon: '06', title: 'Social Distribution', desc: 'Highlights on Twitter, TikTok, and Instagram' },
];

export function AboutPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 relative" ref={ref}>
      {/* Section divider with red bleed */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-sws-600/20" />
      <div className="absolute top-0 left-[7%] w-32 h-[1px] bg-gradient-to-r from-red/40 to-transparent" />
      <div className="max-w-container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-black text-sws-white">About</h2>
              <div className="h-[3px] w-20 bg-gradient-to-r from-red to-red/30 rounded-full" />
            </div>

            <div className="space-y-5 text-sws-300 leading-relaxed">
              <p>
                <strong className="text-sws-white">South Ward Signal</strong> is an independent media outlet
                built by and for New York Red Bulls supporters. We combine advanced soccer analytics with
                AI-powered content generation to deliver coverage that&apos;s faster, deeper, and more
                data-rich than traditional sports media.
              </p>
              <p>
                Every article is backed by real data from American Soccer Analysis, FBref, and API-Football.
                Our AI writing system generates first drafts that are then validated against source data
                before publication — no hallucinated stats, no fabricated quotes.
              </p>
              <p>
                Named after the supporters&apos; section at Red Bull Arena, South Ward Signal represents
                the passion of the terrace married with the precision of modern analytics.
              </p>
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 mt-8 text-sm font-mono text-red hover:text-accent transition-colors"
            >
              Learn more
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Link>
          </motion.div>

          {/* Right: Coverage types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coverageTypes.map((item, i) => (
              <motion.div
                key={item.title}
                className="p-5 bg-bg-card border border-sws-600/20 rounded-lg hover:border-red/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group/card"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red scale-x-0 group-hover/card:scale-x-100 transition-transform duration-300 origin-left" />
                <span className="text-[10px] font-mono text-red opacity-60 mb-3 block">{item.icon}</span>
                <h4 className="text-sm font-semibold text-sws-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-sws-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
