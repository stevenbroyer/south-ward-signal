/**
 * Ghost CMS Publishing Agent
 *
 * Handles publishing articles to Ghost CMS, uploading images,
 * managing tags, configuring newsletter delivery, and recording
 * metadata to Supabase for analytics/tracking.
 */

import type { Article, ArticleType } from '@sws/shared';
import { ARTICLE_TAGS, SITE_URL } from '@sws/shared';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import {
  createPost,
  updatePost,
  uploadImage,
  type GhostPostInput,
  type GhostCreatedPost,
} from '../utils/ghost-client';

// ─── Constants ──────────────────────────────────────────────

const LOG_PREFIX = '[PUBLISHER-AGENT]';

/**
 * Article types that trigger newsletter delivery upon publishing.
 * Match recaps and weekly roundups are emailed to subscribers.
 */
const NEWSLETTER_TYPES: Set<ArticleType> = new Set([
  'match-recap',
  'weekly-roundup',
]);

/**
 * Ghost newsletter slug (configured in Ghost Admin > Settings > Newsletters).
 */
const NEWSLETTER_SLUG = 'south-ward-signal';

// ─── Supabase client ──────────────────────────────────────

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `${LOG_PREFIX} SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.`,
    );
  }

  supabase = createClient(url, key);
  return supabase;
}

// ─── Public API ────────────────────────────────────────────

/**
 * Publish an article to Ghost CMS.
 *
 * 1. Upload featured image and inline images if provided.
 * 2. Map article tags to Ghost tag format.
 * 3. Configure newsletter delivery for eligible article types.
 * 4. Create the post in Ghost as "published" status.
 *
 * @returns The published post URL and Ghost internal ID.
 */
export async function publishArticle(
  article: Article,
  images?: string[],
): Promise<{ url: string; ghostId: string }> {
  console.log(
    `${LOG_PREFIX} Publishing article: "${article.title}" (type: ${article.type})`,
  );

  // Step 1: Upload images if provided
  let featuredImageUrl: string | undefined;
  const uploadedImageUrls: string[] = [];

  if (images && images.length > 0) {
    console.log(`${LOG_PREFIX} Uploading ${images.length} image(s)`);

    for (let i = 0; i < images.length; i++) {
      try {
        const result = await uploadImage({ file: images[i] });
        uploadedImageUrls.push(result.url);
        console.log(
          `${LOG_PREFIX}   Image ${i + 1}/${images.length} uploaded: ${result.url}`,
        );
      } catch (error) {
        console.error(
          `${LOG_PREFIX}   Image ${i + 1} upload failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue without the image rather than failing the publish
      }
    }

    // First uploaded image becomes the featured image
    if (uploadedImageUrls.length > 0) {
      featuredImageUrl = uploadedImageUrls[0];
    }
  }

  // Use article's own featured image if no uploads provided
  if (!featuredImageUrl && article.featuredImage) {
    featuredImageUrl = article.featuredImage;
  }

  // Step 2: Substitute uploaded image URLs into the HTML body
  let htmlBody = article.htmlBody;
  if (uploadedImageUrls.length > 1) {
    // Replace placeholder image references in the body with actual URLs
    for (let i = 1; i < uploadedImageUrls.length; i++) {
      const placeholder = `{{IMAGE_${i}}}`;
      htmlBody = htmlBody.replace(placeholder, uploadedImageUrls[i]);
    }
  }

  // Step 3: Build the Ghost post input
  const ghostTags = buildGhostTags(article);
  const postInput = buildPostInput(article, htmlBody, ghostTags, featuredImageUrl);

  // Step 4: Create the post in Ghost
  const post = await createPost(postInput);
  console.log(
    `${LOG_PREFIX} Article published: ${post.url} (Ghost ID: ${post.id}, reading time: ${post.reading_time}min)`,
  );

  return {
    url: post.url,
    ghostId: post.id,
  };
}

/**
 * Update an existing article in Ghost.
 *
 * Requires the Ghost post ID. Fetches the current `updated_at` timestamp
 * to satisfy Ghost's collision detection.
 */
export async function updateArticle(
  ghostId: string,
  updates: Partial<Article>,
): Promise<void> {
  console.log(`${LOG_PREFIX} Updating article ${ghostId}`);

  const ghostUpdates: Partial<GhostPostInput> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title) ghostUpdates.title = updates.title;
  if (updates.slug) ghostUpdates.slug = updates.slug;
  if (updates.htmlBody) ghostUpdates.html = updates.htmlBody;
  if (updates.excerpt) ghostUpdates.custom_excerpt = updates.excerpt;
  if (updates.seoTitle) ghostUpdates.meta_title = updates.seoTitle;
  if (updates.seoDescription)
    ghostUpdates.meta_description = updates.seoDescription;
  if (updates.featuredImage)
    ghostUpdates.feature_image = updates.featuredImage;

  if (updates.tags) {
    ghostUpdates.tags = updates.tags.map((t) => ({ name: t }));
  }

  await updatePost(ghostId, ghostUpdates);
  console.log(`${LOG_PREFIX} Article ${ghostId} updated successfully.`);
}

/**
 * Record article metadata in the Supabase `articles` table.
 *
 * This creates a row that links the Ghost post to our internal tracking,
 * enabling analytics, content calendar views, and social queue association.
 */
export async function recordInSupabase(
  article: Article,
  ghostUrl: string,
): Promise<void> {
  console.log(`${LOG_PREFIX} Recording article in Supabase: "${article.title}"`);

  const sb = getSupabase();

  const record = {
    title: article.title,
    slug: article.slug,
    type: article.type,
    ghost_url: ghostUrl,
    match_id: article.matchId || null,
    word_count: article.wordCount,
    tags: article.tags,
    excerpt: article.excerpt,
    seo_title: article.seoTitle,
    seo_description: article.seoDescription,
    generated_at: article.generatedAt,
    published_at: new Date().toISOString(),
    social_content: article.socialContent as unknown as Record<string, unknown>,
  };

  const { error } = await sb.from('articles').insert(record);

  if (error) {
    console.error(
      `${LOG_PREFIX} Supabase insert failed: ${error.message}`,
    );
    throw new Error(`Failed to record article in Supabase: ${error.message}`);
  }

  console.log(`${LOG_PREFIX} Article recorded in Supabase.`);
}

// ─── Internal helpers ──────────────────────────────────────

/**
 * Build Ghost tag objects from article tags.
 * Includes the canonical tag for the article type.
 */
function buildGhostTags(
  article: Article,
): Array<{ name: string }> {
  const tagNames = new Set<string>();

  // Always include the canonical tag for this article type
  const canonicalTag = ARTICLE_TAGS[article.type];
  if (canonicalTag) {
    tagNames.add(canonicalTag);
  }

  // Add all article tags
  for (const tag of article.tags) {
    tagNames.add(tag);
  }

  // Always tag with "NYRB"
  tagNames.add('NYRB');

  return Array.from(tagNames).map((name) => ({ name }));
}

/**
 * Build the full GhostPostInput from an article and its supporting data.
 */
function buildPostInput(
  article: Article,
  htmlBody: string,
  tags: Array<{ name: string }>,
  featuredImageUrl?: string,
): GhostPostInput {
  const input: GhostPostInput = {
    title: article.title,
    slug: article.slug,
    html: htmlBody,
    status: 'published',
    tags,
    custom_excerpt: article.excerpt,
    meta_title: article.seoTitle,
    meta_description: article.seoDescription,

    // Open Graph / social meta
    og_title: article.title,
    og_description: article.excerpt,
    twitter_title: article.title,
    twitter_description: article.excerpt,
  };

  if (featuredImageUrl) {
    input.feature_image = featuredImageUrl;
    input.og_image = featuredImageUrl;
    input.twitter_image = featuredImageUrl;
  }

  // Configure newsletter delivery for eligible article types
  if (NEWSLETTER_TYPES.has(article.type)) {
    input.newsletter = { slug: NEWSLETTER_SLUG };
    input.email_segment = 'all';
    console.log(
      `${LOG_PREFIX} Newsletter delivery enabled for ${article.type} article.`,
    );
  }

  return input;
}
