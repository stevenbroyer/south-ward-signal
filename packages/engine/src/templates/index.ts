/**
 * Content Engine Prompt Templates
 *
 * Barrel export for all prompt template builders. Each template exports a
 * function that takes typed data and returns a structured user prompt string.
 * These prompts are paired with the system prompt from prompts/system.ts.
 *
 * @module templates
 */

export { buildMatchRecapPrompt } from './match-recap';
export { buildPreMatchPreviewPrompt, buildPreMatchPreviewPrompt as buildPreviewPrompt } from './pre-match-preview';
export type { PreviewFixture } from './pre-match-preview';
export { buildPlayerSpotlightPrompt } from './player-spotlight';
export { buildPowerRankingsPrompt } from './power-rankings';
export { buildTransferIntelPrompt } from './transfer-intel';
export type { TransferRumor, MarketValueEntry } from './transfer-intel';
export { buildStatOfWeekPrompt } from './stat-of-week';
export { buildSocialOnlyPrompt } from './social-posts';
export type { SocialOnlyData } from './social-posts';
