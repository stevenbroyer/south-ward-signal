/**
 * Content Generation Agent (Writer)
 *
 * Generates articles by combining structured data with Claude's language
 * model via the claude-client util. Uses templates for each article type
 * and the system prompt for editorial voice. Parses Claude's structured
 * response into the Article schema.
 */

import type {
  Article,
  ArticleType,
  MatchData,
  Fixture,
  Standing,
  PlayerStats,
  SocialContent,
} from '@sws/shared';
import { ARTICLE_TAGS, AI_DISCLOSURE } from '@sws/shared';

import {
  callClaude,
  parseStructuredResponse,
  parseNumberedList,
} from '../utils/claude-client';
import { buildSystemPrompt } from '../prompts/system';

import {
  buildMatchRecapPrompt,
  buildPreviewPrompt,
  buildPlayerSpotlightPrompt,
  buildPowerRankingsPrompt,
  buildTransferIntelPrompt,
  buildStatOfWeekPrompt,
} from '../templates';

// ─── Constants ──────────────────────────────────────────────

const LOG_PREFIX = '[WRITER-AGENT]';
const MAX_PARSE_RETRIES = 2;

// ─── Response Parsing ──────────────────────────────────────

/**
 * Parse Claude's structured response into a fully-typed Article.
 * Expects the three-section format: metadata / body / social.
 */
function parseArticleResponse(
  raw: string,
  type: ArticleType,
  matchId?: string,
): Article {
  const { metadata, body, social } = parseStructuredResponse(raw);

  // Validate required metadata fields
  const title = metadata.TITLE || metadata.Title || '';
  const slug = metadata.SLUG || metadata.Slug || '';
  const excerpt = metadata.EXCERPT || metadata.Excerpt || '';
  const seoTitle = metadata.SEO_TITLE || metadata.SeoTitle || title;
  const seoDescription =
    metadata.SEO_DESCRIPTION || metadata.SeoDescription || excerpt;
  const tagsRaw = metadata.TAGS || metadata.Tags || '';
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Ensure the article type's canonical tag is included
  const canonicalTag = ARTICLE_TAGS[type];
  if (canonicalTag && !tags.includes(canonicalTag)) {
    tags.unshift(canonicalTag);
  }

  if (!title || !slug || !body) {
    throw new ParseError(
      `Missing required fields: ${[
        !title && 'TITLE',
        !slug && 'SLUG',
        !body && 'body',
      ]
        .filter(Boolean)
        .join(', ')}`,
    );
  }

  // Build social content
  const socialContent = parseSocialContent(social);

  // Ensure AI disclosure is present in the body
  let finalBody = body;
  if (
    !finalBody.includes('AI assistance') &&
    !finalBody.includes('generated with AI')
  ) {
    finalBody += '\n\n' + AI_DISCLOSURE;
  }

  // Convert markdown body to basic HTML for Ghost
  const htmlBody = markdownToHtml(finalBody);

  // Word count (strip HTML tags for counting)
  const wordCount = finalBody
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    title,
    slug,
    type,
    excerpt,
    body: finalBody,
    htmlBody,
    tags,
    seoTitle: seoTitle.slice(0, 60),
    seoDescription: seoDescription.slice(0, 155),
    matchId,
    socialContent,
    wordCount,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Parse the social sections from a structured response.
 */
function parseSocialContent(
  social: Record<string, string>,
): SocialContent {
  const twitter = social.TWITTER_THREAD
    ? parseNumberedList(social.TWITTER_THREAD)
    : [];

  const tiktokCaption = social.TIKTOK_CAPTION || '';
  const instagramCaption = social.INSTAGRAM_CAPTION || '';
  const instagramHashtags = social.INSTAGRAM_HASHTAGS
    ? social.INSTAGRAM_HASHTAGS.split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : [];
  const bluesky = social.BLUESKY_THREAD
    ? parseNumberedList(social.BLUESKY_THREAD)
    : [];

  const content: SocialContent = { twitter };

  if (tiktokCaption) {
    content.tiktok = {
      caption: tiktokCaption,
      slides: [],
    };
  }

  if (instagramCaption) {
    content.instagram = {
      caption: instagramCaption,
      hashtags: instagramHashtags,
    };
  }

  if (bluesky.length > 0) {
    content.bluesky = bluesky;
  }

  return content;
}

/**
 * Minimal markdown-to-HTML conversion for Ghost.
 * Ghost accepts both markdown and HTML; this handles the basics
 * so the body can be rendered directly in Ghost's editor.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(
    /(<li>.*<\/li>\n?)+/g,
    (match) => `<ul>\n${match}</ul>\n`,
  );

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Paragraphs: wrap remaining lines that aren't already in tags
  const lines = html.split('\n');
  const wrapped = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    return `<p>${line}</p>`;
  });
  html = wrapped.join('\n');

  // Clean up empty lines
  html = html.replace(/\n{3,}/g, '\n\n');

  return html.trim();
}

// ─── Generation with retry ──────────────────────────────────

/**
 * Generate content via Claude and parse the structured response.
 * Retries up to MAX_PARSE_RETRIES times if the response cannot be parsed,
 * providing clarified instructions on each retry.
 */
async function generateAndParse(
  userPrompt: string,
  type: ArticleType,
  matchId?: string,
  additionalContext?: string,
): Promise<Article> {
  const systemPrompt = buildSystemPrompt(additionalContext);
  let currentPrompt = userPrompt;

  for (let attempt = 0; attempt <= MAX_PARSE_RETRIES; attempt++) {
    if (attempt > 0) {
      console.warn(
        `${LOG_PREFIX} Parse retry ${attempt}/${MAX_PARSE_RETRIES} for ${type}`,
      );
    }

    const response = await callClaude({
      systemPrompt,
      userPrompt: currentPrompt,
      maxTokens: 6000,
      temperature: 0.7,
    });

    console.log(
      `${LOG_PREFIX} Claude response received: ${response.inputTokens} in / ${response.outputTokens} out (${response.latencyMs}ms)`,
    );

    try {
      const article = parseArticleResponse(response.text, type, matchId);
      console.log(
        `${LOG_PREFIX} Article parsed: "${article.title}" (${article.wordCount} words)`,
      );
      return article;
    } catch (error) {
      if (attempt === MAX_PARSE_RETRIES) {
        throw new Error(
          `Failed to parse ${type} response after ${MAX_PARSE_RETRIES + 1} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Add clarification instructions for retry
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      currentPrompt =
        userPrompt +
        `\n\nIMPORTANT: Your previous response could not be parsed. Error: "${errorMsg}". ` +
        `You MUST follow the exact output format with TITLE:, SLUG:, EXCERPT:, SEO_TITLE:, SEO_DESCRIPTION:, TAGS: in the header, ` +
        `--- delimiters separating sections, and TWITTER_THREAD:, TIKTOK_CAPTION:, INSTAGRAM_CAPTION:, INSTAGRAM_HASHTAGS:, BLUESKY_THREAD: in the social section.`;
    }
  }

  // TypeScript: unreachable, but satisfies the compiler
  throw new Error(`Unreachable: ${type} generation loop exited unexpectedly`);
}

// ─── Public API ────────────────────────────────────────────

/**
 * Generate a match recap article from post-match data.
 */
export async function generateMatchRecap(
  data: MatchData,
): Promise<Article> {
  console.log(
    `${LOG_PREFIX} Generating match recap: ${data.home_team} ${data.home_score}-${data.away_score} ${data.away_team}`,
  );

  const userPrompt = buildMatchRecapPrompt(data);
  return generateAndParse(userPrompt, 'match-recap', data.match_id);
}

/**
 * Generate a pre-match preview article.
 */
export async function generatePreview(
  fixture: Fixture,
  standings?: Standing[],
  form?: MatchData[],
): Promise<Article> {
  console.log(
    `${LOG_PREFIX} Generating preview: ${fixture.home_team} vs ${fixture.away_team}`,
  );

  const userPrompt = buildPreviewPrompt(fixture, standings, form);
  return generateAndParse(userPrompt, 'pre-match-preview');
}

/**
 * Generate a player spotlight article.
 */
export async function generatePlayerSpotlight(
  player: PlayerStats,
  matches?: MatchData[],
): Promise<Article> {
  console.log(
    `${LOG_PREFIX} Generating player spotlight: ${player.name}`,
  );

  const userPrompt = buildPlayerSpotlightPrompt(player, matches);
  return generateAndParse(userPrompt, 'player-spotlight');
}

/**
 * Generate a power rankings article for the current week.
 */
export async function generatePowerRankings(
  standings: Standing[],
  week: number,
): Promise<Article> {
  console.log(
    `${LOG_PREFIX} Generating power rankings for week ${week}`,
  );

  const userPrompt = buildPowerRankingsPrompt(standings, week);
  return generateAndParse(userPrompt, 'power-rankings');
}

/**
 * Generate a transfer intel article from rumor data.
 */
export async function generateTransferIntel(
  rumors: any[],
): Promise<Article> {
  console.log(
    `${LOG_PREFIX} Generating transfer intel (${rumors.length} rumors)`,
  );

  const userPrompt = buildTransferIntelPrompt(rumors);
  return generateAndParse(userPrompt, 'transfer-intel');
}

/**
 * Generate a stat-of-the-week article from standings data.
 */
export async function generateStatOfWeek(
  standings: Standing[],
): Promise<Article> {
  console.log(
    `${LOG_PREFIX} Generating stat of the week`,
  );

  const userPrompt = buildStatOfWeekPrompt(standings);
  return generateAndParse(userPrompt, 'stat-of-week');
}

// ─── Error types ────────────────────────────────────────────

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}
