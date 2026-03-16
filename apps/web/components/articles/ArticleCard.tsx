'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TagBadge } from './TagBadge';
import { MatchRecapCover } from './MatchRecapCover';
import { PlayerRatingsCover } from './PlayerRatingsCover';
import { formatDate } from '@/lib/utils';

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  feature_image?: string;
  primary_tag?: string;
  published_at: string;
  reading_time?: number;
}

export function ArticleCard({
  slug,
  title,
  excerpt,
  feature_image,
  primary_tag,
  published_at,
  reading_time,
}: ArticleCardProps) {
  return (
    <Link href={`/articles/${slug}`}>
      <motion.article
        className="group bg-bg-card rounded-lg overflow-hidden border border-sws-700/50 hover:border-sws-600/80 transition-colors duration-300"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Image or Match Recap Cover */}
        {feature_image ? (
          <div className="relative overflow-hidden aspect-[16/9]">
            <img
              src={feature_image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card/60 to-transparent" />
          </div>
        ) : primary_tag === 'match-recap' || primary_tag === 'Match Recap' ? (
          <MatchRecapCover title={title} className="aspect-[16/9]" />
        ) : primary_tag === 'player-ratings' || primary_tag === 'Player Ratings' ? (
          <PlayerRatingsCover title={title} className="aspect-[16/9]" />
        ) : null}

        {/* Content */}
        <div className="p-5">
          {primary_tag && (
            <div className="mb-3">
              <TagBadge tag={primary_tag} />
            </div>
          )}

          <h3 className="font-display font-bold text-lg text-sws-white leading-tight mb-2 group-hover:text-accent transition-colors duration-200">
            {title}
          </h3>

          <p className="text-sm text-sws-400 line-clamp-2 mb-4 leading-relaxed">
            {excerpt}
          </p>

          <div className="flex items-center gap-3 text-xs text-sws-500 font-mono">
            <time>{formatDate(published_at)}</time>
            {reading_time && (
              <>
                <span className="w-1 h-1 rounded-full bg-sws-600" />
                <span>{reading_time} min read</span>
              </>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
