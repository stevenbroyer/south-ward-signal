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
        className="group flex items-center gap-4 py-3 border-b border-sws-700/40 hover:border-sws-600/60 transition-colors"
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <time className="text-xs font-mono text-sws-500 w-16 shrink-0">
          {formatDateShort(published_at)}
        </time>
        <h4 className="text-sm text-sws-200 group-hover:text-sws-white transition-colors flex-1 truncate">
          {title}
        </h4>
        {primary_tag && <TagBadge tag={primary_tag} className="shrink-0 hidden sm:inline-block" />}
      </motion.div>
    </Link>
  );
}
