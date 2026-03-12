'use client';

import Link from 'next/link';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const TAG_COLORS: Record<string, string> = {
  'Match Recap': '#ED1A3D',
  'Preview': '#3B82F6',
  'Player Spotlight': '#D4A843',
  'Power Rankings': '#8B5CF6',
  'Stat of the Week': '#F59E0B',
  'Transfer Intel': '#10B981',
  'Weekly Roundup': '#EC4899',
  'Article': '#6B7280',
};

export interface LatestArticle {
  slug: string;
  title: string;
  excerpt: string;
  primary_tag: string;
  published_at: string;
  reading_time: number;
  feature_image?: string;
}

interface LatestSectionProps {
  articles?: LatestArticle[];
}

export function LatestSection({ articles }: LatestSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const rest = articles.slice(1, 5);

  return (
    <section className="relative py-24 md:py-32" ref={ref}>
      <div className="max-w-container mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-display font-black text-sws-white">Latest</h2>
            <div className="h-[3px] w-20 bg-gradient-to-r from-red to-red/30 rounded-full" />
          </div>
          <Link
            href="/articles"
            className="text-sm font-mono text-sws-400 hover:text-sws-white transition-colors flex items-center gap-2"
          >
            View all
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured article */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Link href={`/articles/${featured.slug}`} className="group block">
              <div className="relative aspect-[16/10] bg-bg-card rounded-lg overflow-hidden mb-5 border border-sws-600/30 group-hover:border-red/40 group-hover:glow-red transition-all duration-500">
                {/* Placeholder gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated via-bg-card to-bg opacity-80" />
                <div className="absolute inset-0 grid-pattern opacity-20" />

                {/* xG visualization bar */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-mono text-sws-400">RBNY</span>
                        <span className="text-[10px] font-mono text-sws-white">2.81 xG</span>
                      </div>
                      <div className="h-1.5 bg-sws-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-mono text-sws-400">CHI</span>
                        <span className="text-[10px] font-mono text-sws-white">0.94 xG</span>
                      </div>
                      <div className="h-1.5 bg-sws-700 rounded-full overflow-hidden">
                        <div className="h-full bg-sws-400 rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tag overlay */}
                <div className="absolute top-4 left-4">
                  <span
                    className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded"
                    style={{ backgroundColor: `${TAG_COLORS[featured.primary_tag] || TAG_COLORS.Article}20`, color: TAG_COLORS[featured.primary_tag] || TAG_COLORS.Article }}
                  >
                    {featured.primary_tag}
                  </span>
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-display font-bold text-sws-white group-hover:text-red transition-colors duration-300 mb-3">
                {featured.title}
              </h3>
              <p className="text-sm text-sws-300 leading-relaxed mb-3">{featured.excerpt}</p>
              <div className="flex items-center gap-3 text-xs font-mono text-sws-500">
                <span>{new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>&middot;</span>
                <span>{featured.reading_time} min read</span>
              </div>
            </Link>
          </motion.div>

          {/* Article list */}
          <div className="flex flex-col gap-1">
            {rest.map((article, i) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="group flex items-start gap-4 py-5 border-b border-sws-600/20 hover:border-sws-600/40 transition-colors"
                >
                  <span className="text-xs font-mono text-sws-500 pt-1 shrink-0 w-16">
                    {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded"
                        style={{ backgroundColor: `${TAG_COLORS[article.primary_tag] || TAG_COLORS.Article}15`, color: TAG_COLORS[article.primary_tag] || TAG_COLORS.Article }}
                      >
                        {article.primary_tag}
                      </span>
                      <span className="text-[10px] font-mono text-sws-500">{article.reading_time} min</span>
                    </div>
                    <h4 className="text-sm font-semibold text-sws-100 group-hover:text-sws-white group-hover:translate-x-1 transition-all duration-200 line-clamp-2">
                      {article.title}
                    </h4>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
