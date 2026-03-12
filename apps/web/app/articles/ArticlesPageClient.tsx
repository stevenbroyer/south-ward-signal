'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FeaturedArticle } from '@/components/articles/FeaturedArticle';
import { ArticleGrid } from '@/components/articles/ArticleGrid';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

const TAGS = ['All', 'Match Recap', 'Preview', 'Player Spotlight', 'Power Rankings', 'Transfer Intel', 'Stat of the Week'];

interface ArticleItem {
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  primary_tag: string;
  published_at: string;
  reading_time: number;
}

export default function ArticlesPageClient({ articles }: { articles: ArticleItem[] }) {
  const [activeTag, setActiveTag] = useState('All');

  const featured = articles[0];
  const rest = articles.slice(1);
  const filtered = activeTag === 'All'
    ? rest
    : articles.filter((a) => a.primary_tag === activeTag);

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
          <div className="mb-12">
            <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">Coverage</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white">Latest Coverage</h1>
            <p className="text-sws-400 mt-3 max-w-lg">
              Match recaps, tactical previews, player deep dives, and data-driven analysis of the New York Red Bulls.
            </p>
          </div>
        </RevealOnScroll>

        {/* Tag Filters */}
        <RevealOnScroll delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-10">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                  activeTag === tag
                    ? 'bg-red text-white'
                    : 'bg-bg-elevated text-sws-400 border border-sws-700/50 hover:text-sws-white hover:border-sws-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Featured */}
        {activeTag === 'All' && featured && (
          <RevealOnScroll className="mb-10">
            <FeaturedArticle {...featured} />
          </RevealOnScroll>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ArticleGrid>
              {filtered.map((article) => (
                <ArticleCard key={article.slug} {...article} />
              ))}
            </ArticleGrid>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
