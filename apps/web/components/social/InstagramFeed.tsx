'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

interface InstagramPost {
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

interface InstagramFeedProps {
  className?: string;
  limit?: number;
}

export function InstagramFeed({ className, limit = 6 }: InstagramFeedProps) {
  const { data: posts, isLoading } = useQuery<InstagramPost[]>({
    queryKey: ['instagram-feed', limit],
    queryFn: async () => {
      const res = await fetch(`/api/social/instagram?limit=${limit}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-square bg-bg-card rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className={className}>
        <p className="text-sws-400 text-sm">Follow us on Instagram for match day content and supporter culture.</p>
        <a
          href="https://instagram.com/southwardsignal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-accent hover:text-red transition-colors"
        >
          @southwardsignal &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square overflow-hidden rounded group"
          >
            <Image
              src={post.media_url}
              alt={post.caption?.slice(0, 100) || 'Instagram post'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
