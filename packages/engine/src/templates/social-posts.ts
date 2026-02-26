/**
 * Social-Only Posts Prompt Template
 *
 * Builds the user prompt for standalone social media content that is NOT
 * attached to a full article. Used for quick-hit stat drops, breaking news
 * blasts, matchday hype posts, and engagement-driven content.
 *
 * Output is social-only: Twitter thread, TikTok caption, Instagram caption
 * with hashtags, and Bluesky posts.
 *
 * @module templates/social-posts
 */

/** Input data for standalone social content generation. */
export interface SocialOnlyData {
  /** The headline or main topic for the social content. */
  headline: string;
  /** Array of key stats or facts to build content around. */
  key_stats: string[];
  /** URL to link back to (article, site, or landing page). */
  article_url: string;
  /**
   * Content type for tone calibration.
   * Examples: "stat-drop", "breaking-news", "matchday-hype", "result-reaction",
   * "transfer-rumor", "milestone", "fan-engagement"
   */
  type: string;
}

/**
 * Maps content type to tone guidance for the prompt.
 */
function toneForType(type: string): string {
  switch (type) {
    case 'stat-drop':
      return 'Data-forward. Lead with the most surprising number. Make people stop scrolling.';
    case 'breaking-news':
      return 'Urgent, authoritative. Short sentences. Facts first, context second.';
    case 'matchday-hype':
      return 'High energy. Build anticipation. Rally the fanbase.';
    case 'result-reaction':
      return 'Emotional but grounded. Celebrate wins, be honest about losses. Always lead with the score.';
    case 'transfer-rumor':
      return 'Measured excitement. Always hedge with "reports suggest" or "per [source]". Never present as confirmed.';
    case 'milestone':
      return 'Celebratory and historical. Frame the achievement in context.';
    case 'fan-engagement':
      return 'Conversational. Ask questions. Use polls where possible. Drive replies.';
    default:
      return 'Match the tone to the content. Prioritize engagement and clarity.';
  }
}

/**
 * Builds the user prompt for standalone social media content.
 *
 * @param data - The social content input including headline, key stats,
 *   article URL, and content type.
 * @returns The fully assembled user prompt string to pair with the system prompt.
 *
 * @example
 * ```ts
 * const prompt = buildSocialOnlyPrompt({
 *   headline: 'NYRB lead MLS in goals added through Week 8',
 *   key_stats: ['12.4 total g+', '2nd in xG differential', 'Lewis Morgan: +3.2 g+'],
 *   article_url: 'https://southwardsignal.com/nyrb-goals-added-week-8',
 *   type: 'stat-drop',
 * });
 * ```
 */
export function buildSocialOnlyPrompt(data: SocialOnlyData): string {
  const { headline, key_stats, article_url, type } = data;

  const prompt = `## CONTENT REQUEST: STANDALONE SOCIAL CONTENT

Generate standalone social media content (NOT attached to a full article). This is social-first content optimized for engagement on each platform.

---

### CONTENT DETAILS

- **Headline / Topic:** ${headline}
- **Content Type:** ${type}
- **Link:** ${article_url}

### KEY STATS & FACTS

${key_stats.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### TONE GUIDANCE

${toneForType(type)}

---

### OUTPUT FORMAT

Generate the following social content. This is a social-only output -- there is NO article body. Use a modified version of the standard output format:

\`\`\`
TITLE: ${headline}
SLUG: social-only
EXCERPT: N/A
SEO_TITLE: N/A
SEO_DESCRIPTION: N/A
TAGS: social, ${type}
---
*This is standalone social content. No article body.*
---
TWITTER_THREAD:
1. <tweet 1>
2. <tweet 2>
...
TIKTOK_CAPTION: <caption>
INSTAGRAM_CAPTION: <caption>
INSTAGRAM_HASHTAGS: <comma-separated>
BLUESKY_THREAD:
1. <post 1>
...
\`\`\`

### PLATFORM SPECIFICATIONS

**Twitter/X Thread (3-5 tweets):**
- Tweet 1: The HOOK. Most engaging stat or claim. Must stop the scroll. Under 280 chars.
- Tweets 2-3: Supporting stats, context, or hot takes. Each under 280 chars.
- Tweet 4 (optional): Engagement question or poll prompt.
- Final tweet: Link back to ${article_url} with a CTA ("Full breakdown:", "More:", etc.).
- Use line breaks within tweets for readability.
- Numbers and stats should be formatted for visual impact (e.g., "3.2 g+" not "a goals-added value of 3.2").

**TikTok Caption (1):**
- Under 150 characters.
- Hook-first format. Lead with the most provocative claim or stat.
- Use trending format patterns (e.g., "POV:", "The stat nobody is talking about:", "Name a better ___.").
- No hashtags in caption (platform handles those separately).

**Instagram Caption (1):**
- 3-6 sentences in a storytelling or listicle format.
- Include a CTA (e.g., "Link in bio for the full breakdown.").
- End with a question to drive comments.

**Instagram Hashtags:**
- 8-12 hashtags, comma-separated.
- Mix of broad (#MLS, #Soccer), team-specific (#RBNY, #NewYorkRedBulls), and topic-specific.
- Include #SouthWardSignal.

**Bluesky Thread (2-3 posts):**
- Each post under 300 characters.
- Post 1: Key stat or hook.
- Post 2: Context or analysis.
- Post 3 (optional): Link and CTA.

### REMINDERS

- Every stat must come from the KEY STATS & FACTS section above. Do not invent or estimate.
- Optimize for engagement: hooks, controversy (within reason), questions, hot takes.
- Each platform has a different audience. Twitter is fast and stat-heavy. Instagram is visual and storytelling. TikTok is punchy and trend-driven. Bluesky is conversational and community-focused.
- Do not repeat the same phrasing across platforms. Each should feel native to its platform.
- The article URL (${article_url}) should appear in the final tweet and optionally in the Bluesky thread. Instagram uses "link in bio" convention.`;

  return prompt;
}
