'use client';

import { motion } from 'motion/react';

interface SocialPost {
  platform: 'twitter' | 'instagram' | 'tiktok';
  content: string;
  timestamp: string;
  url: string;
}

const SAMPLE_POSTS: SocialPost[] = [
  { platform: 'twitter', content: 'Vanzeir with the clinical finish. 2-1 Red Bulls. The press is relentless tonight. #RBNY', timestamp: '2h ago', url: '#' },
  { platform: 'twitter', content: 'xG after 70 minutes: RBNY 1.52 - 0.82 PHI. Red Bulls controlling the game through the middle third.', timestamp: '3h ago', url: '#' },
  { platform: 'instagram', content: 'Match day vibes from the South Ward. Packed house at Red Bull Arena tonight.', timestamp: '5h ago', url: '#' },
  { platform: 'twitter', content: 'Lewis Morgan is having an elite season. 4 goals, 3 assists — and his underlying numbers are even better.', timestamp: '1d ago', url: '#' },
];

const platformIcons: Record<string, { color: string; label: string }> = {
  twitter: { color: '#1DA1F2', label: 'X' },
  instagram: { color: '#E4405F', label: 'IG' },
  tiktok: { color: '#00F2EA', label: 'TT' },
};

interface SocialFeedProps {
  posts?: SocialPost[];
  className?: string;
}

export function SocialFeed({ posts = SAMPLE_POSTS, className = '' }: SocialFeedProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {posts.map((post, i) => {
        const platform = platformIcons[post.platform];
        return (
          <motion.a
            key={i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-bg-card border border-sws-700/50 rounded-lg p-4 hover:border-sws-600/80 transition-colors group"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start gap-3">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-mono font-bold text-white"
                style={{ backgroundColor: `${platform.color}30`, color: platform.color }}
              >
                {platform.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sws-200 leading-relaxed group-hover:text-sws-white transition-colors line-clamp-3">
                  {post.content}
                </p>
                <p className="text-[10px] font-mono text-sws-500 mt-2">{post.timestamp}</p>
              </div>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
