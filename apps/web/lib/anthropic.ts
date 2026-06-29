import Anthropic from '@anthropic-ai/sdk';

/**
 * Model that powers the admin article-builder AI features.
 * Override with ANTHROPIC_MODEL if you ever want to switch tiers.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

let client: Anthropic | null = null;

/** True when an API key is configured — lets the UI hide AI buttons gracefully. */
export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Lazily construct a singleton Anthropic client. Throws if the key is missing. */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to apps/web/.env.local to enable the AI article builder.',
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}
