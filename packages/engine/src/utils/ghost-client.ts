/**
 * Ghost Admin API Wrapper
 *
 * Handles authentication, post creation, image upload, tag management,
 * and newsletter delivery via Ghost's Admin API.
 */

// @ts-expect-error -- @tryghost/admin-api has no type declarations
import GhostAdminAPI from '@tryghost/admin-api';

export interface GhostClientConfig {
  url: string;
  adminApiKey: string;
  version?: string;
}

export interface GhostPostInput {
  title: string;
  slug: string;
  html: string;
  feature_image?: string;
  custom_excerpt?: string;
  tags?: Array<{ name: string }>;
  status?: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  newsletter?: { slug: string };
  email_segment?: string;
}

export interface GhostCreatedPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  url: string;
  published_at: string | null;
  feature_image: string | null;
  reading_time: number;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface GhostImageUpload {
  url: string;
  ref: string | null;
}

let apiInstance: InstanceType<typeof GhostAdminAPI> | null = null;

function getApi(config?: GhostClientConfig): InstanceType<typeof GhostAdminAPI> {
  if (apiInstance) return apiInstance;

  const url = config?.url || process.env.GHOST_URL;
  const key = config?.adminApiKey || process.env.GHOST_ADMIN_API_KEY;
  const version = config?.version || 'v5.0';

  if (!url || !key) {
    throw new Error(
      'Ghost Admin API requires GHOST_URL and GHOST_ADMIN_API_KEY env vars.',
    );
  }

  apiInstance = new GhostAdminAPI({ url, key, version });
  return apiInstance;
}

/**
 * Create a new post in Ghost.
 */
export async function createPost(
  input: GhostPostInput,
  config?: GhostClientConfig,
): Promise<GhostCreatedPost> {
  const api = getApi(config);

  const postData: Record<string, unknown> = {
    title: input.title,
    slug: input.slug,
    html: input.html,
    status: input.status || 'draft',
    tags: input.tags || [],
  };

  if (input.feature_image) postData.feature_image = input.feature_image;
  if (input.custom_excerpt) postData.custom_excerpt = input.custom_excerpt;
  if (input.published_at) postData.published_at = input.published_at;
  if (input.meta_title) postData.meta_title = input.meta_title;
  if (input.meta_description) postData.meta_description = input.meta_description;
  if (input.og_title) postData.og_title = input.og_title;
  if (input.og_description) postData.og_description = input.og_description;
  if (input.og_image) postData.og_image = input.og_image;
  if (input.twitter_title) postData.twitter_title = input.twitter_title;
  if (input.twitter_description) postData.twitter_description = input.twitter_description;
  if (input.twitter_image) postData.twitter_image = input.twitter_image;

  // Newsletter delivery -- Ghost sends the email when the post goes live
  if (input.newsletter) {
    postData.newsletter = input.newsletter;
    postData.email_segment = input.email_segment || 'all';
  }

  const post = await api.posts.add(postData, { source: 'html' });

  return {
    id: post.id,
    uuid: post.uuid,
    title: post.title,
    slug: post.slug,
    url: post.url,
    published_at: post.published_at,
    feature_image: post.feature_image,
    reading_time: post.reading_time ?? 0,
  };
}

/**
 * Update an existing post.
 */
export async function updatePost(
  postId: string,
  updates: Partial<GhostPostInput> & { updated_at: string },
  config?: GhostClientConfig,
): Promise<GhostCreatedPost> {
  const api = getApi(config);
  const post = await api.posts.edit({ id: postId, ...updates }, { source: 'html' });
  return {
    id: post.id,
    uuid: post.uuid,
    title: post.title,
    slug: post.slug,
    url: post.url,
    published_at: post.published_at,
    feature_image: post.feature_image,
    reading_time: post.reading_time ?? 0,
  };
}

/**
 * Upload an image to Ghost.
 * Accepts either a file path or a Buffer with a filename.
 */
export async function uploadImage(
  imageInput: { file: string } | { data: Buffer; filename: string },
  config?: GhostClientConfig,
): Promise<GhostImageUpload> {
  const api = getApi(config);

  let result: { url: string; ref: string | null };
  if ('file' in imageInput) {
    result = await api.images.upload({ file: imageInput.file });
  } else {
    result = await api.images.upload({
      file: imageInput.data,
      filename: imageInput.filename,
    });
  }

  return { url: result.url, ref: result.ref ?? null };
}

/**
 * Get or create a tag by name. Ghost auto-creates tags if they don't exist
 * when included in a post, but this method is useful for pre-validation.
 */
export async function ensureTag(
  tagName: string,
  description?: string,
  config?: GhostClientConfig,
): Promise<GhostTag> {
  const api = getApi(config);

  // Try to find existing tag
  try {
    const tags = await api.tags.browse({ filter: `name:'${tagName}'`, limit: 1 });
    if (tags && tags.length > 0) {
      return tags[0] as GhostTag;
    }
  } catch {
    // Tag browse failed, try to create
  }

  // Create new tag
  const tag = await api.tags.add({
    name: tagName,
    description: description || null,
  });

  return tag as GhostTag;
}

/**
 * Fetch recent posts for deduplication checks.
 */
export async function getRecentPosts(
  limit: number = 10,
  config?: GhostClientConfig,
): Promise<GhostCreatedPost[]> {
  const api = getApi(config);
  const posts = await api.posts.browse({
    limit,
    order: 'published_at desc',
    fields: 'id,uuid,title,slug,url,published_at,feature_image,reading_time',
  });

  return (posts || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    uuid: p.uuid as string,
    title: p.title as string,
    slug: p.slug as string,
    url: p.url as string,
    published_at: p.published_at as string | null,
    feature_image: p.feature_image as string | null,
    reading_time: (p.reading_time as number) ?? 0,
  }));
}

/**
 * Schedule a post to be published at a future time.
 */
export async function schedulePost(
  postId: string,
  publishAt: Date,
  updatedAt: string,
  config?: GhostClientConfig,
): Promise<GhostCreatedPost> {
  return updatePost(
    postId,
    {
      status: 'scheduled',
      published_at: publishAt.toISOString(),
      updated_at: updatedAt,
    },
    config,
  );
}
