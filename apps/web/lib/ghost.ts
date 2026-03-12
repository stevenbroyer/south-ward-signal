import type { GhostPost } from '@sws/shared';
import { z } from 'zod';

const GHOST_URL = process.env.GHOST_URL || 'http://localhost:2368';
const GHOST_KEY = process.env.GHOST_CONTENT_API_KEY || '';

const GhostTagSchema = z.object({
  name: z.string(),
  slug: z.string(),
}).passthrough();

const GhostAuthorSchema = z.object({
  name: z.string(),
}).passthrough();

const GhostPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional().default(''),
  custom_excerpt: z.string().nullable().optional(),
  feature_image: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  reading_time: z.number().optional().default(5),
  primary_tag: GhostTagSchema.nullable().optional(),
  tags: z.array(GhostTagSchema).optional(),
  html: z.string().nullable().optional(),
  authors: z.array(GhostAuthorSchema).optional(),
}).passthrough();

async function ghostFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${GHOST_URL}/ghost/api/content/${endpoint}/`);
  url.searchParams.set('key', GHOST_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    next: { tags: ['ghost-posts'], revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Ghost API error: ${res.status}`);
  return res.json();
}

export async function getLatestArticles(limit = 10): Promise<GhostPost[]> {
  try {
    const data = await ghostFetch('posts', {
      limit: String(limit),
      include: 'tags,authors',
      fields: 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag,html',
      order: 'published_at DESC',
    });
    const parsed = z.array(GhostPostSchema).safeParse(data.posts);
    return (parsed.success ? parsed.data : data.posts ?? []) as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const data = await ghostFetch(`posts/slug/${slug}`, {
      include: 'tags,authors',
    });
    const posts = data.posts ?? [];
    if (!posts.length) return null;
    const parsed = GhostPostSchema.safeParse(posts[0]);
    return (parsed.success ? parsed.data : posts[0]) as unknown as GhostPost;
  } catch {
    return null;
  }
}

export async function getArticlesByTag(tag: string, limit = 20): Promise<GhostPost[]> {
  try {
    const data = await ghostFetch('posts', {
      limit: String(limit),
      filter: `tag:${tag}`,
      include: 'tags',
      fields: 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag',
      order: 'published_at DESC',
    });
    const parsed = z.array(GhostPostSchema).safeParse(data.posts);
    return (parsed.success ? parsed.data : data.posts ?? []) as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const data = await ghostFetch('posts', {
      limit: 'all',
      fields: 'slug',
    });
    return (data.posts as Array<{ slug: string }>).map(p => p.slug);
  } catch {
    return [];
  }
}
