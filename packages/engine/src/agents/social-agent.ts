/**
 * Social Distribution Agent
 *
 * Handles social media distribution of published articles.
 * Queues posts to Supabase's social_queue table with staggered scheduling,
 * posts directly to Twitter via OAuth 1.0a (Twitter API v2), and uses
 * Ayrshare as a fallback for Instagram, TikTok, and Bluesky.
 */

import type { Article, SocialPlatform } from '@sws/shared';
import { SOCIAL_HANDLES, SITE_URL } from '@sws/shared';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── Constants ──────────────────────────────────────────────

const LOG_PREFIX = '[SOCIAL-AGENT]';

/**
 * Staggered scheduling offsets (in minutes) from the article publish time.
 * - Twitter: immediate + thread posts 2 hours apart
 * - Instagram: 1 hour after first tweet
 * - TikTok: 3 hours after publish
 * - Bluesky: 30 minutes after first tweet
 */
const SCHEDULE_OFFSETS: Record<SocialPlatform, number> = {
  twitter: 0,
  instagram: 60,
  tiktok: 180,
  bluesky: 30,
};

/**
 * Time between individual tweets in a thread (in minutes).
 */
const TWEET_THREAD_INTERVAL_MINUTES = 120;

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
 * Queue social media posts for all platforms in Supabase's social_queue table.
 * Each entry is scheduled with staggered timing to maximize engagement.
 *
 * Platforms queued:
 * - Twitter: thread posts, first at publish, subsequent every 2 hours
 * - Instagram: caption + hashtags, 1 hour after first tweet
 * - TikTok: caption, 3 hours after publish
 * - Bluesky: thread posts, 30 minutes after first tweet
 */
export async function queueSocialPosts(
  article: Article,
  articleUrl: string,
): Promise<void> {
  console.log(
    `${LOG_PREFIX} Queuing social posts for: "${article.title}"`,
  );

  const sb = getSupabase();
  const now = new Date();
  const records: Array<Record<string, unknown>> = [];

  // Derive a stable article_id from the slug + generated timestamp
  const articleId = `${article.slug}-${article.generatedAt}`;

  // ── Twitter thread ────────────────────────────────────
  if (article.socialContent.twitter.length > 0) {
    const tweets = article.socialContent.twitter;

    for (let i = 0; i < tweets.length; i++) {
      let text = tweets[i];

      // Append link to the last tweet in the thread
      if (i === tweets.length - 1 && !text.includes('http')) {
        text += `\n\n${articleUrl}`;
      }

      const scheduledFor = new Date(
        now.getTime() +
          SCHEDULE_OFFSETS.twitter * 60_000 +
          i * TWEET_THREAD_INTERVAL_MINUTES * 60_000,
      );

      records.push({
        article_id: articleId,
        platform: 'twitter',
        content: {
          text,
          thread_position: i + 1,
          thread_total: tweets.length,
        },
        images: [],
        status: 'queued',
        scheduled_for: scheduledFor.toISOString(),
      });
    }

    console.log(
      `${LOG_PREFIX}   Twitter: ${tweets.length} tweet(s) queued, ` +
        `first at ${new Date(now.getTime() + SCHEDULE_OFFSETS.twitter * 60_000).toISOString()}`,
    );
  }

  // ── Instagram ─────────────────────────────────────────
  if (article.socialContent.instagram) {
    const { caption, hashtags } = article.socialContent.instagram;
    const fullCaption = `${caption}\n\n${hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`;

    const scheduledFor = new Date(
      now.getTime() + SCHEDULE_OFFSETS.instagram * 60_000,
    );

    records.push({
      article_id: articleId,
      platform: 'instagram',
      content: {
        text: fullCaption,
        link: articleUrl,
      },
      images: article.featuredImage ? [article.featuredImage] : [],
      status: 'queued',
      scheduled_for: scheduledFor.toISOString(),
    });

    console.log(
      `${LOG_PREFIX}   Instagram: queued for ${scheduledFor.toISOString()}`,
    );
  }

  // ── TikTok ────────────────────────────────────────────
  if (article.socialContent.tiktok) {
    const { caption } = article.socialContent.tiktok;
    const scheduledFor = new Date(
      now.getTime() + SCHEDULE_OFFSETS.tiktok * 60_000,
    );

    records.push({
      article_id: articleId,
      platform: 'tiktok',
      content: {
        text: caption,
        link: articleUrl,
      },
      images: [],
      status: 'queued',
      scheduled_for: scheduledFor.toISOString(),
    });

    console.log(
      `${LOG_PREFIX}   TikTok: queued for ${scheduledFor.toISOString()}`,
    );
  }

  // ── Bluesky ───────────────────────────────────────────
  if (article.socialContent.bluesky && article.socialContent.bluesky.length > 0) {
    const posts = article.socialContent.bluesky;

    for (let i = 0; i < posts.length; i++) {
      let text = posts[i];

      // Append link to last post
      if (i === posts.length - 1 && !text.includes('http')) {
        text += `\n\n${articleUrl}`;
      }

      const scheduledFor = new Date(
        now.getTime() +
          SCHEDULE_OFFSETS.bluesky * 60_000 +
          i * 15 * 60_000, // Bluesky thread posts 15 minutes apart
      );

      records.push({
        article_id: articleId,
        platform: 'bluesky',
        content: {
          text,
          thread_position: i + 1,
          thread_total: posts.length,
        },
        images: [],
        status: 'queued',
        scheduled_for: scheduledFor.toISOString(),
      });
    }

    console.log(
      `${LOG_PREFIX}   Bluesky: ${posts.length} post(s) queued`,
    );
  }

  // ── Insert all records into Supabase ──────────────────
  if (records.length === 0) {
    console.warn(`${LOG_PREFIX} No social content to queue.`);
    return;
  }

  const { error } = await sb.from('social_queue').insert(records);

  if (error) {
    console.error(
      `${LOG_PREFIX} Supabase insert failed: ${error.message}`,
    );
    throw new Error(
      `Failed to queue social posts in Supabase: ${error.message}`,
    );
  }

  console.log(
    `${LOG_PREFIX} ${records.length} social post(s) queued successfully.`,
  );
}

/**
 * Post a tweet to Twitter using OAuth 1.0a and the Twitter API v2.
 *
 * @param text - The tweet text (max 280 characters).
 * @param images - Optional array of image URLs to upload as media.
 * @returns The tweet ID if successful, null on failure.
 */
export async function postToTwitter(
  text: string,
  images?: string[],
): Promise<string | null> {
  console.log(`${LOG_PREFIX} Posting to Twitter (${text.length} chars)`);

  const consumerKey = process.env.TWITTER_CONSUMER_KEY;
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    console.error(`${LOG_PREFIX} Twitter OAuth credentials not configured.`);
    return null;
  }

  try {
    // Upload media if provided
    const mediaIds: string[] = [];

    if (images && images.length > 0) {
      for (const imageUrl of images) {
        const mediaId = await uploadTwitterMedia(
          imageUrl,
          consumerKey,
          consumerSecret,
          accessToken,
          accessSecret,
        );
        if (mediaId) {
          mediaIds.push(mediaId);
        }
      }
    }

    // Build the tweet payload
    const tweetPayload: Record<string, unknown> = { text };
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }

    // Sign and send the request
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    const authHeader = buildOAuth1Header(
      method,
      url,
      {},
      consumerKey,
      consumerSecret,
      accessToken,
      accessSecret,
    );

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `${LOG_PREFIX} Twitter API error ${response.status}: ${errorText}`,
      );
      return null;
    }

    const result = (await response.json()) as {
      data: { id: string; text: string };
    };

    console.log(`${LOG_PREFIX} Tweet posted: ${result.data.id}`);
    return result.data.id;
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Twitter post failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * Post to a social platform via Ayrshare's API.
 * Used as a fallback for Instagram, TikTok, and Bluesky.
 *
 * @param platform - One of: "instagram", "tiktok", "bluesky"
 * @param text - The post text.
 * @param images - Optional image URLs.
 * @returns External post ID if successful, null on failure.
 */
export async function postViaAyrshare(
  platform: string,
  text: string,
  images?: string[],
): Promise<string | null> {
  console.log(
    `${LOG_PREFIX} Posting to ${platform} via Ayrshare (${text.length} chars)`,
  );

  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    console.error(`${LOG_PREFIX} AYRSHARE_API_KEY not configured.`);
    return null;
  }

  try {
    // Map platform names to Ayrshare's expected format
    const platformMap: Record<string, string> = {
      instagram: 'instagram',
      tiktok: 'tiktok',
      bluesky: 'bluesky',
    };

    const ayrPlatform = platformMap[platform];
    if (!ayrPlatform) {
      console.error(`${LOG_PREFIX} Unsupported Ayrshare platform: ${platform}`);
      return null;
    }

    const payload: Record<string, unknown> = {
      post: text,
      platforms: [ayrPlatform],
    };

    if (images && images.length > 0) {
      payload.mediaUrls = images;
    }

    const response = await fetch('https://app.ayrshare.com/api/post', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `${LOG_PREFIX} Ayrshare API error ${response.status}: ${errorText}`,
      );
      return null;
    }

    const result = (await response.json()) as {
      id?: string;
      postIds?: Array<{ id: string; platform: string }>;
    };

    const postId =
      result.postIds?.find((p) => p.platform === ayrPlatform)?.id ||
      result.id ||
      null;

    if (postId) {
      console.log(
        `${LOG_PREFIX} ${platform} post created via Ayrshare: ${postId}`,
      );
    }

    return postId ?? null;
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Ayrshare post failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

// ─── OAuth 1.0a Implementation ────────────────────────────

/**
 * Build an OAuth 1.0a Authorization header for Twitter API v2.
 */
function buildOAuth1Header(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessSecret: string,
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Combine OAuth params and query params, then sort
  const allParams: Record<string, string> = {
    ...queryParams,
    ...oauthParams,
  };

  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(
      (key) =>
        `${percentEncode(key)}=${percentEncode(allParams[key])}`,
    )
    .join('&');

  // Build the signature base string
  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join('&');

  // Build the signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessSecret)}`;

  // Generate the signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  oauthParams['oauth_signature'] = signature;

  // Build the Authorization header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(
      (key) =>
        `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`,
    )
    .join(', ');

  return `OAuth ${headerParts}`;
}

/**
 * RFC 3986 percent-encoding.
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Upload media to Twitter's v1.1 media/upload endpoint.
 * Required for attaching images to v2 tweet creation.
 *
 * @returns The media_id_string if successful, null on failure.
 */
async function uploadTwitterMedia(
  imageUrl: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessSecret: string,
): Promise<string | null> {
  try {
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`${LOG_PREFIX} Failed to download image: ${imageUrl}`);
      return null;
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');

    // Upload to Twitter media endpoint
    const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const authHeader = buildOAuth1Header(
      'POST',
      uploadUrl,
      {},
      consumerKey,
      consumerSecret,
      accessToken,
      accessSecret,
    );

    const formData = new URLSearchParams();
    formData.append('media_data', base64Image);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `${LOG_PREFIX} Twitter media upload error ${response.status}: ${errorText}`,
      );
      return null;
    }

    const result = (await response.json()) as {
      media_id_string: string;
    };

    console.log(
      `${LOG_PREFIX} Twitter media uploaded: ${result.media_id_string}`,
    );
    return result.media_id_string;
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Twitter media upload failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}
