'use client';

import Link from 'next/link';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { XFeed } from '@/components/social/XFeed';
import { InstagramFeed } from '@/components/social/InstagramFeed';

export function SocialPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 relative" ref={ref}>
      {/* Section divider with red bleed */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-sws-600/20" />
      <div className="absolute top-0 left-[7%] w-32 h-[1px] bg-gradient-to-r from-red/40 to-transparent" />

      <div className="max-w-container mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-3">Follow the Signal</p>
            <div className="flex items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-display font-black text-sws-white">From the Stands</h2>
              <div className="h-[3px] w-20 bg-gradient-to-r from-red to-red/30 rounded-full" />
            </div>
          </div>
          <Link
            href="/social"
            className="text-xs font-mono text-sws-500 hover:text-sws-white transition-colors items-center gap-2 hidden sm:flex"
          >
            VIEW ALL
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* X Feed */}
          <motion.div
            className="bg-bg-card border border-sws-600/30 rounded-lg p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">@SouthWardSignal on X</span>
              <a
                href="https://twitter.com/SouthWardSignal"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-mono text-sws-500 hover:text-red transition-colors"
              >
                Follow &rarr;
              </a>
            </div>
            <XFeed limit={3} />
          </motion.div>

          {/* Instagram Feed */}
          <motion.div
            className="bg-bg-card border border-sws-600/30 rounded-lg p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono text-sws-500 uppercase tracking-widest">@southwardsignal on Instagram</span>
              <a
                href="https://instagram.com/southwardsignal"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-mono text-sws-500 hover:text-red transition-colors"
              >
                Follow &rarr;
              </a>
            </div>
            <InstagramFeed limit={6} />
          </motion.div>
        </div>

        {/* Mobile "View all" link */}
        <Link
          href="/social"
          className="block text-center mt-8 text-xs font-mono text-sws-500 hover:text-sws-white transition-colors sm:hidden"
        >
          View all &rarr;
        </Link>
      </div>
    </section>
  );
}
