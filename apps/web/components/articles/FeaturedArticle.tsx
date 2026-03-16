'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TagBadge } from './TagBadge';
import { MatchRecapCover } from './MatchRecapCover';
import { PlayerRatingsCover } from './PlayerRatingsCover';
import { formatDate } from '@/lib/utils';

interface FeaturedArticleProps {
  slug: string;
  title: string;
  excerpt: string;
  feature_image?: string;
  primary_tag?: string;
  published_at: string;
  reading_time?: number;
  homeXg?: number;
  awayXg?: number;
}

export function FeaturedArticle({
  slug,
  title,
  excerpt,
  feature_image,
  primary_tag,
  published_at,
  reading_time,
  homeXg = 1.82,
  awayXg = 0.95,
}: FeaturedArticleProps) {
  const maxXg = Math.max(homeXg, awayXg, 1);

  return (
    <Link href={`/articles/${slug}`}>
      <motion.article
        className="group relative bg-bg-card rounded-xl overflow-hidden border border-sws-700/50 hover:border-glow transition-all duration-500"
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto">
            {feature_image ? (
              <img
                src={feature_image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (primary_tag === 'match-recap' || primary_tag === 'Match Recap') ? (
              <MatchRecapCover title={title} className="w-full h-full" />
            ) : (primary_tag === 'player-ratings' || primary_tag === 'Player Ratings') ? (
              <PlayerRatingsCover title={title} className="w-full h-full" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-bg-card via-bg-card/40 to-transparent lg:from-transparent lg:via-transparent lg:to-bg-card" />
            {primary_tag && (
              <div className="absolute top-4 left-4">
                <TagBadge tag={primary_tag} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-xs text-sws-500 font-mono mb-4">
              <time>{formatDate(published_at)}</time>
              {reading_time && (
                <>
                  <span className="w-1 h-1 rounded-full bg-sws-600" />
                  <span>{reading_time} min read</span>
                </>
              )}
            </div>

            <h2 className="font-display font-black text-2xl lg:text-4xl text-sws-white leading-[1.1] mb-4 group-hover:text-gradient transition-all duration-300">
              {title}
            </h2>

            <p className="text-sws-300 leading-relaxed mb-6 line-clamp-3 lg:line-clamp-4">
              {excerpt}
            </p>

            {/* Mini xG Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-mono text-sws-400">
                <span>NYRB xG</span>
                <span className="text-red">{homeXg.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-sws-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(homeXg / (maxXg * 1.2)) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-sws-400">
                <span>OPP xG</span>
                <span className="text-sws-300">{awayXg.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-sws-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sws-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(awayXg / (maxXg * 1.2)) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red group-hover:text-accent transition-colors">
              Read Full Analysis
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
