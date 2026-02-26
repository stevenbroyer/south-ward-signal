/**
 * Anthropic SDK Wrapper
 *
 * Wraps the @anthropic-ai/sdk with exponential backoff retry, structured
 * error handling, and token-usage tracking.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1_000;

export interface ClaudeRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
  model: string;
  latencyMs: number;
}

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to your .env file.',
      );
    }
    clientInstance = new Anthropic({ apiKey });
  }
  return clientInstance;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    const status = error.status;
    // Retry on rate limits (429), server errors (500-599), and overloaded (529)
    if (status === 429 || status === 529 || (status >= 500 && status < 600)) {
      return true;
    }
  }
  // Retry on network errors
  if (error instanceof TypeError && (error as Error).message.includes('fetch')) {
    return true;
  }
  return false;
}

/**
 * Send a message to Claude with exponential backoff retry.
 * Retries up to MAX_RETRIES times on transient failures (429, 5xx, network).
 */
export async function callClaude(
  options: ClaudeRequestOptions,
): Promise<ClaudeResponse> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = 4096,
    temperature = 0.7,
    stopSequences,
  } = options;

  const client = getClient();
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      const jitter = Math.random() * backoff * 0.2;
      console.warn(
        `[claude-client] Retry ${attempt}/${MAX_RETRIES} after ${Math.round(backoff + jitter)}ms`,
      );
      await sleep(backoff + jitter);
    }

    const start = Date.now();

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        ...(stopSequences ? { stop_sequences: stopSequences } : {}),
      });

      const latencyMs = Date.now() - start;

      // Extract text from content blocks
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        stopReason: response.stop_reason,
        model: response.model,
        latencyMs,
      };
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === MAX_RETRIES) {
        break;
      }
    }
  }

  // All retries exhausted or non-retryable error
  if (lastError instanceof Anthropic.APIError) {
    throw new Error(
      `Claude API error after ${MAX_RETRIES + 1} attempts: [${lastError.status}] ${lastError.message}`,
    );
  }
  throw new Error(
    `Claude API call failed after ${MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

/**
 * Parse a structured response from Claude that uses section markers.
 * Expects format like:
 *   TITLE: ...
 *   SLUG: ...
 *   ---
 *   <body>
 *   ---
 *   TWITTER_THREAD:
 *   ...
 */
export function parseStructuredResponse(raw: string): {
  metadata: Record<string, string>;
  body: string;
  social: Record<string, string>;
} {
  const metadata: Record<string, string> = {};
  const social: Record<string, string> = {};

  // Split on the --- delimiters
  const parts = raw.split(/^---$/m);

  if (parts.length < 2) {
    // Fallback: treat entire response as body
    return { metadata: {}, body: raw.trim(), social: {} };
  }

  // Part 0: metadata header
  const headerLines = parts[0].trim().split('\n');
  for (const line of headerLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      metadata[key] = value;
    }
  }

  // Part 1: article body (markdown)
  const body = parts[1].trim();

  // Part 2+: social content sections
  if (parts.length >= 3) {
    const socialBlock = parts.slice(2).join('---').trim();
    let currentSection = '';
    const socialLines = socialBlock.split('\n');
    for (const line of socialLines) {
      const sectionMatch = line.match(
        /^(TWITTER_THREAD|TIKTOK_CAPTION|INSTAGRAM_CAPTION|INSTAGRAM_HASHTAGS|BLUESKY_THREAD):(.*)$/,
      );
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        const inlineValue = sectionMatch[2].trim();
        social[currentSection] = inlineValue || '';
      } else if (currentSection) {
        social[currentSection] = social[currentSection]
          ? social[currentSection] + '\n' + line
          : line;
      }
    }

    // Trim all social values
    for (const key of Object.keys(social)) {
      social[key] = social[key].trim();
    }
  }

  return { metadata, body, social };
}

/**
 * Parse a numbered list from a social section.
 * "1. First post\n2. Second post" => ["First post", "Second post"]
 */
export function parseNumberedList(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');
  let currentItem = '';

  for (const line of lines) {
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) {
      if (currentItem) items.push(currentItem.trim());
      currentItem = match[1];
    } else if (currentItem && line.trim()) {
      currentItem += ' ' + line.trim();
    }
  }
  if (currentItem) items.push(currentItem.trim());
  return items;
}
