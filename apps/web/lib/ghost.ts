// @ts-expect-error — no type declarations available
import GhostContentAPI from '@tryghost/content-api';
import type { GhostPost } from '@sws/shared';

const ghost = new GhostContentAPI({
  url: process.env.GHOST_URL || 'http://localhost:2368',
  key: process.env.GHOST_CONTENT_API_KEY || '',
  version: 'v5.0',
});

export async function getLatestArticles(limit = 10): Promise<GhostPost[]> {
  try {
    const posts = await ghost.posts.browse({
      limit,
      include: ['tags', 'authors'],
      fields: [
        'id', 'title', 'slug', 'excerpt', 'custom_excerpt', 'feature_image',
        'published_at', 'reading_time', 'primary_tag', 'html',
      ],
      order: 'published_at DESC',
    });
    return posts as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const post = await ghost.posts.read({ slug }, { include: ['tags', 'authors'] });
    return post as unknown as GhostPost;
  } catch {
    return null;
  }
}

export async function getArticlesByTag(tag: string, limit = 20): Promise<GhostPost[]> {
  try {
    const posts = await ghost.posts.browse({
      limit,
      filter: `tag:${tag}`,
      include: ['tags'],
      fields: [
        'id', 'title', 'slug', 'excerpt', 'custom_excerpt', 'feature_image',
        'published_at', 'reading_time', 'primary_tag',
      ],
      order: 'published_at DESC',
    });
    return posts as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const posts = await ghost.posts.browse({
      limit: 'all',
      fields: ['slug'],
    });
    return (posts as unknown as Array<{ slug: string }>).map(p => p.slug);
  } catch {
    return [];
  }
}
