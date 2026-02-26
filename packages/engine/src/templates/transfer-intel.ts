/**
 * Transfer Intel Prompt Template
 *
 * Builds the user prompt for transfer rumor / market intel articles.
 * Accepts an array of transfer rumors with confidence levels, optional
 * market values, and optional editorial context for framing.
 *
 * Target length: 500-800 words. Includes a mandatory speculation disclaimer.
 *
 * @module templates/transfer-intel
 */

/** A single transfer rumor entry. */
export interface TransferRumor {
  /** Player's full name. */
  player: string;
  /** Current club or "Free Agent". */
  from: string;
  /** Destination club. */
  to: string;
  /** Reported transfer fee, if known (e.g., "$2.5M", "loan"). */
  fee?: string;
  /** Reporting source (e.g., "The Athletic", "Tom Bogert"). */
  source?: string;
  /** Editorial confidence assessment. */
  confidence: 'low' | 'medium' | 'high';
}

/** Market value context for a player. */
export interface MarketValueEntry {
  player: string;
  value: string;
}

/**
 * Maps confidence to a human-readable label for the prompt.
 */
function confidenceLabel(level: TransferRumor['confidence']): string {
  switch (level) {
    case 'high':
      return 'HIGH -- multiple reliable sources, advanced talks reported';
    case 'medium':
      return 'MEDIUM -- credible reports but no confirmation';
    case 'low':
      return 'LOW -- early-stage speculation or single unverified source';
  }
}

/**
 * Formats the rumors into a structured block for the prompt.
 */
function formatRumors(rumors: TransferRumor[], marketValues?: MarketValueEntry[]): string {
  const mvMap = new Map(marketValues?.map((mv) => [mv.player, mv.value]) ?? []);

  return rumors
    .map((r, i) => {
      let entry = `${i + 1}. **${r.player}**\n`;
      entry += `   From: ${r.from}\n`;
      entry += `   To: ${r.to}\n`;
      entry += `   Confidence: ${confidenceLabel(r.confidence)}\n`;
      if (r.fee) entry += `   Reported Fee: ${r.fee}\n`;
      if (r.source) entry += `   Source: ${r.source}\n`;
      const mv = mvMap.get(r.player);
      if (mv) entry += `   Market Value: ${mv}\n`;
      return entry;
    })
    .join('\n');
}

/**
 * Builds the user prompt for a transfer intel article.
 *
 * @param rumors - Array of transfer rumors with player, clubs, fee, source,
 *   and confidence level.
 * @param marketValues - Optional array of player market value estimates for context.
 * @param context - Optional editorial context string (e.g., transfer window status,
 *   roster compliance deadlines, salary cap notes).
 * @returns The fully assembled user prompt string to pair with the system prompt.
 *
 * @example
 * ```ts
 * const prompt = buildTransferIntelPrompt(
 *   [{ player: 'John Doe', from: 'Club A', to: 'New York Red Bulls', confidence: 'medium' }],
 *   [{ player: 'John Doe', value: '$3.2M' }],
 *   'Secondary transfer window opens July 7.',
 * );
 * ```
 */
export function buildTransferIntelPrompt(
  rumors: TransferRumor[],
  marketValues?: MarketValueEntry[],
  context?: string,
): string {
  const highConfidence = rumors.filter((r) => r.confidence === 'high');
  const medConfidence = rumors.filter((r) => r.confidence === 'medium');
  const lowConfidence = rumors.filter((r) => r.confidence === 'low');

  let prompt = `## CONTENT REQUEST: TRANSFER INTEL

Write a transfer intel roundup article. Target length: **500-800 words**.

**CRITICAL: This article discusses transfer RUMORS and SPECULATION. The following disclaimer MUST appear at the top of the article body, before any other content:**

> *Transfer Intel is South Ward Signal's roundup of the latest transfer rumors, reports, and speculation surrounding the New York Red Bulls. Unless explicitly stated as confirmed, all moves discussed below are unconfirmed and based on media reports. Confidence levels reflect our editorial assessment of source reliability and report volume, not insider knowledge.*

---

### TRANSFER RUMORS

${formatRumors(rumors, marketValues)}

### CONFIDENCE BREAKDOWN

- High confidence targets: ${highConfidence.length} (${highConfidence.map((r) => r.player).join(', ') || 'none'})
- Medium confidence targets: ${medConfidence.length} (${medConfidence.map((r) => r.player).join(', ') || 'none'})
- Low confidence targets: ${lowConfidence.length} (${lowConfidence.map((r) => r.player).join(', ') || 'none'})
`;

  if (marketValues && marketValues.length > 0) {
    prompt += `\n### MARKET VALUES (Transfermarkt estimates)\n\n`;
    prompt += marketValues.map((mv) => `  ${mv.player}: ${mv.value}`).join('\n');
    prompt += '\n';
  }

  if (context) {
    prompt += `\n### EDITORIAL CONTEXT\n\n${context}\n`;
  }

  prompt += `
---

### ARTICLE STRUCTURE

Write the article with the following sections in order:

1. **Disclaimer** (as specified above -- include verbatim as a blockquote at the top of the body)

2. **Overview (2-3 sentences)** -- What is the overall transfer picture for NYRB right now? Are they active buyers, looking to sell, or quiet? Frame the window status.

3. **Target Profiles** -- For EACH rumor listed above, write a subsection:
   - **Player Name** as the subsection heading.
   - What position do they play? Where are they coming from?
   - If a fee and/or market value is provided, discuss the financial angle.
   - Assess the fit: why would NYRB want this player? What role would they fill?
   - Clearly state the confidence level. For LOW confidence rumors, use hedging language ("early whispers suggest...", "unverified reports link..."). For HIGH confidence, be more direct ("multiple sources indicate advanced talks...").
   - If a source is provided, attribute it.

4. **Squad Needs Analysis (2-3 sentences)** -- Step back and assess: based on these rumors, what positions is NYRB prioritizing? Does the pattern of targets reveal a strategic direction?

5. **Conclusion (1-2 sentences)** -- What should fans watch for next? Are any deals close to completion?

### SOCIAL CONTENT

After the article body, generate:
- **Twitter/X thread:** 4-5 tweets. Lead with the highest-confidence rumor. Use "RUMOR:" prefix for each player tweet. End with a "What do you think?" engagement hook.
- **TikTok caption:** Under 150 characters. Transfer rumor hook.
- **Instagram caption:** Storytelling format, 3-5 hashtags including #MLSTransfers.
- **Bluesky thread:** 2-3 posts, 300 char limit each.

### REMINDERS

- Use the EXACT output format specified in the system prompt (TITLE, SLUG, EXCERPT, etc.).
- NEVER present a rumor as confirmed unless the confidence level is explicitly noted as confirmed in the data.
- Clearly differentiate between HIGH, MEDIUM, and LOW confidence reports in your language.
- If a source is provided, attribute it. If no source is provided, use passive construction ("reports suggest...", "links have emerged...").
- Do not fabricate player statistics. If you do not have stats for a target, focus on the reported role, fee, and fit.
- The disclaimer is NON-NEGOTIABLE. It must be the first thing in the article body.`;

  return prompt;
}
