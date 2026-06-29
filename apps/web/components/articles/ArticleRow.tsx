'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TagBadge } from './TagBadge';
import { formatDateShort } from '@/lib/utils';

interface ArticleRowProps {
  slug: string;
  title: string;
  primary_tag?: string;
  published_at: string;
}

export function ArticleRow({ slug, title, primary_tag, published_at }: ArticleRowProps) {
  return (
    <Link href={`/articles/${slug}`}>
      <motion.div
        className="group py-3 border-b border-sws-700/40 hover:border-sws-600/60 transition-colors"
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <h4 className="text-sm text-sws-200 group-hover:text-sws-white transition-colors line-clamp-2 mb-1.5">
          {title}
        </h4>
        <div className="flex items-center gap-3">
          <time className="text-xs font-mono text-sws-500">
            {formatDateShort(published_at)}
          </time>
          {primary_tag && <TagBadge tag={primary_tag} />}
        </div>
      </motion.div>
    </Link>
  );
}
