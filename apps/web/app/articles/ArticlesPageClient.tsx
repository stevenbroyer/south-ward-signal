'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FeaturedArticle } from '@/components/articles/FeaturedArticle';
import { ArticleGrid } from '@/components/articles/ArticleGrid';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

const CONTENT_TYPES = [
  { label: 'All', tag: null },
  { label: 'Match Recap', tag: 'match-recap' },
  { label: 'Player Ratings', tag: 'player-ratings' },
  { label: 'Preview', tag: 'pre-match-preview' },
  { label: 'Tactical Analysis', tag: 'tactical-analysis' },
  { label: 'Player Spotlight', tag: 'player-spotlight' },
  { label: 'Transfer Intel', tag: 'transfer-intel' },
  { label: 'Data Deep-Dive', tag: 'data-deep-dive' },
  { label: 'Opinion', tag: 'opinion' },
  { label: 'Supporter Culture', tag: 'supporter-culture' },
  { label: 'Historical', tag: 'historical' },
  { label: 'Power Rankings', tag: 'power-rankings' },
  { label: 'Weekly Roundup', tag: 'weekly-roundup' },
] as const;

interface ArticleItem {
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  primary_tag: string;
  primary_tag_slug: string;
  tag_slugs: string[];
  published_at: string;
  reading_time: number;
}

export default function ArticlesPageClient({ articles }: { articles: ArticleItem[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Only show filter pills for categories that have at least one article
  const availableTypes = useMemo(() => {
    return CONTENT_TYPES.filter((ct) => {
      if (ct.tag === null) return true; // Always show "All"
      return articles.some(
        (a) => a.primary_tag_slug === ct.tag || a.tag_slugs.includes(ct.tag)
      );
    });
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeTag === null) return articles;
    return articles.filter(
      (a) => a.primary_tag_slug === activeTag || a.tag_slugs.includes(activeTag)
    );
  }, [articles, activeTag]);

  const featured = activeTag === null ? filtered[0] : null;
  const gridArticles = activeTag === null ? filtered.slice(1) : filtered;

  const displayCount = filtered.length;

  if (articles.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-container mx-auto px-6">
          <RevealOnScroll>
            <div className="mb-12">
              <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">Coverage</p>
              <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white">Latest Coverage</h1>
              <p className="text-sws-400 mt-3 max-w-lg">
                No articles published yet. Check back soon for match recaps, tactical previews, and data-driven analysis.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-container mx-auto px-6">
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-8">
            <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">Coverage</p>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white">Latest</h1>
              <span className="text-sm font-mono text-sws-500">
                {displayCount} {displayCount === 1 ? 'article' : 'articles'}
              </span>
            </div>
            <p className="text-sws-400 mt-3 max-w-lg">
              Match recaps, tactical previews, player deep dives, and data-driven analysis of the New York Red Bulls.
            </p>
          </div>
        </RevealOnScroll>

        {/* Filter Pills */}
        <RevealOnScroll delay={0.1}>
          <div className="relative mb-10">
            {/* Fade edges for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none opacity-0 md:opacity-0" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none md:hidden" />

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2">
              {availableTypes.map((ct) => {
                const isActive = activeTag === ct.tag;
                return (
                  <button
                    key={ct.label}
                    onClick={() => setActiveTag(ct.tag)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-red text-white border border-red'
                        : 'bg-bg-elevated text-sws-400 border border-sws-600/50 hover:border-sws-400 hover:text-sws-200'
                    }`}
                  >
                    {ct.label}
                  </button>
                );
              })}
            </div>
          </div>
        </RevealOnScroll>

        {/* Featured */}
        {featured && (
          <RevealOnScroll className="mb-10">
            <FeaturedArticle {...featured} />
          </RevealOnScroll>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTag ?? 'all'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {gridArticles.length > 0 ? (
              <ArticleGrid>
                {gridArticles.map((article) => (
                  <ArticleCard key={article.slug} {...article} />
                ))}
              </ArticleGrid>
            ) : !featured ? (
              <div className="text-center py-20">
                <p className="text-sws-500 font-mono text-sm">
                  No articles found for this category yet.
                </p>
                <button
                  onClick={() => setActiveTag(null)}
                  className="mt-4 text-red hover:text-accent text-sm font-semibold transition-colors"
                >
                  View all articles
                </button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
