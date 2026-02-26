/**
 * Quality Assurance Agent
 *
 * Validates generated articles against source data, editorial rules,
 * and content standards. Returns a structured QAResult with individual
 * check results, an overall pass/fail, and a confidence score.
 */

import type { Article, MatchData, QAResult, CheckResult } from '@sws/shared';

import {
  validateScore,
  validateGoalScorers,
  validateNames,
  checkBannedPhrases,
  checkWordCount,
  validateQuotes,
  checkAIDisclosure,
  validateStatClaims,
} from '../utils/validators';

// ─── Constants ──────────────────────────────────────────────

const LOG_PREFIX = '[QA-AGENT]';

/**
 * Checks with severity "critical" that fail will cause the article
 * to fail QA. Warnings reduce confidence but don't block publishing.
 */
const CRITICAL_SEVERITY = 'critical';

// ─── Public API ────────────────────────────────────────────

/**
 * Run ALL validation checks on an article.
 *
 * When `sourceData` is provided (e.g. for match recaps), additional
 * fact-checking is performed: score accuracy, goal scorers, team names,
 * and stat claims are validated against the actual match data.
 *
 * Returns a QAResult with:
 * - `passed`: true only if zero critical failures
 * - `failures`: array of all failing CheckResults
 * - `confidence`: 0-1 score (1.0 = perfect, reduced by warnings/failures)
 */
export async function validateArticle(
  article: Article,
  sourceData?: MatchData,
): Promise<QAResult> {
  console.log(
    `${LOG_PREFIX} Validating article: "${article.title}" (type: ${article.type})`,
  );

  const checks: CheckResult[] = [];

  // ── Universal checks (run on every article) ───────────

  // 1. Word count
  checks.push(checkWordCount(article.body, article.type));
  console.log(`${LOG_PREFIX}   Word count check: ${checks[checks.length - 1].message}`);

  // 2. Banned phrases / cliches
  checks.push(checkBannedPhrases(article.body));
  console.log(`${LOG_PREFIX}   Banned phrases check: ${checks[checks.length - 1].message}`);

  // 3. AI disclosure
  checks.push(checkAIDisclosure(article.htmlBody));
  console.log(`${LOG_PREFIX}   AI disclosure check: ${checks[checks.length - 1].message}`);

  // 4. Quote fabrication check
  const providedQuotes = sourceData?.press_conference_quotes?.map((q) => ({
    text: q.text,
    speaker: q.speaker,
  }));
  checks.push(validateQuotes(article.body, providedQuotes));
  console.log(`${LOG_PREFIX}   Quotes check: ${checks[checks.length - 1].message}`);

  // 5. Slug format validation
  checks.push(validateSlugFormat(article.slug));
  console.log(`${LOG_PREFIX}   Slug format check: ${checks[checks.length - 1].message}`);

  // 6. SEO field validation
  checks.push(validateSeoFields(article));
  console.log(`${LOG_PREFIX}   SEO fields check: ${checks[checks.length - 1].message}`);

  // 7. Social content validation
  checks.push(validateSocialContent(article));
  console.log(`${LOG_PREFIX}   Social content check: ${checks[checks.length - 1].message}`);

  // ── Match-specific checks (when source data is available) ──

  if (sourceData) {
    // 8. Score accuracy
    checks.push(validateScore(article.body, sourceData));
    console.log(`${LOG_PREFIX}   Score check: ${checks[checks.length - 1].message}`);

    // 9. Goal scorers
    if (sourceData.goals.length > 0) {
      checks.push(validateGoalScorers(article.body, sourceData.goals));
      console.log(`${LOG_PREFIX}   Goal scorers check: ${checks[checks.length - 1].message}`);
    }

    // 10. Team names
    checks.push(validateNames(article.body, sourceData));
    console.log(`${LOG_PREFIX}   Team names check: ${checks[checks.length - 1].message}`);

    // 11. Stat claims
    checks.push(validateStatClaims(article.body, sourceData));
    console.log(`${LOG_PREFIX}   Stat claims check: ${checks[checks.length - 1].message}`);
  }

  // ── Compute results ────────────────────────────────────

  const failures = checks.filter((c) => !c.passed);
  const criticalFailures = failures.filter((c) => c.severity === CRITICAL_SEVERITY);
  const warnings = failures.filter((c) => c.severity === 'warning');

  // Confidence score:
  // Start at 1.0, subtract 0.25 per critical failure, 0.10 per warning
  let confidence = 1.0;
  confidence -= criticalFailures.length * 0.25;
  confidence -= warnings.length * 0.10;
  confidence = Math.max(0, Math.round(confidence * 100) / 100);

  const passed = criticalFailures.length === 0;

  const result: QAResult = {
    passed,
    failures,
    confidence,
  };

  console.log(
    `${LOG_PREFIX} QA result: ${passed ? 'PASSED' : 'FAILED'} | ` +
      `${checks.length} checks run, ${failures.length} failures ` +
      `(${criticalFailures.length} critical, ${warnings.length} warnings) | ` +
      `confidence: ${confidence}`,
  );

  return result;
}

/**
 * Determine whether a failed QA result can be fixed by re-generation.
 *
 * Fixable failures: banned phrases, word count, missing AI disclosure,
 * slug format, SEO fields, social content issues.
 *
 * Non-fixable failures (requires data correction, not re-gen):
 * Score mismatch with a non-zero expected score (likely data issue).
 */
export function shouldRetry(result: QAResult): boolean {
  if (result.passed) return false;

  const nonFixableChecks = new Set([
    // If the score in the data itself is wrong, re-generating won't help
  ]);

  // If ALL failures are in fixable categories, retry is worthwhile
  return result.failures.every((f) => !nonFixableChecks.has(f.name));
}

/**
 * Build specific instructions for the writer agent to fix failures.
 * These instructions are appended to the regeneration prompt.
 */
export function buildRetryInstructions(result: QAResult): string {
  if (result.failures.length === 0) return '';

  const instructions: string[] = [
    'The previous article FAILED quality checks. Fix the following issues:',
    '',
  ];

  for (const failure of result.failures) {
    const severity = failure.severity === 'critical' ? 'CRITICAL' : 'WARNING';
    instructions.push(`[${severity}] ${failure.name}: ${failure.message}`);

    // Add specific remediation instructions per check type
    switch (failure.name) {
      case 'score_check':
        instructions.push(
          '  -> Ensure the score appears exactly once in the article, matching the provided data.',
        );
        break;
      case 'goal_scorers_check':
        instructions.push(
          '  -> Mention every goal scorer from the goals array by name.',
        );
        break;
      case 'team_names_check':
        instructions.push(
          '  -> Use "New York Red Bulls" on first reference, then "NYRB" or "the Red Bulls". Never use "New York" alone.',
        );
        break;
      case 'banned_phrases_check':
        instructions.push(
          '  -> Remove or rephrase the banned phrases listed above.',
        );
        break;
      case 'word_count_check':
        instructions.push(
          '  -> Adjust the article length to meet the word count target for this article type.',
        );
        break;
      case 'quotes_check':
        instructions.push(
          '  -> Only use direct quotes that appear in the provided press conference data. Do NOT fabricate any quotes.',
        );
        break;
      case 'ai_disclosure_check':
        instructions.push(
          '  -> Ensure the AI disclosure block appears at the end of the article body.',
        );
        break;
      case 'stat_claims_check':
        instructions.push(
          '  -> Verify every statistical claim against the match data provided. Do not estimate or round creatively.',
        );
        break;
      case 'slug_format_check':
        instructions.push(
          '  -> Slug must be lowercase, hyphen-separated, no special characters, max 8 words.',
        );
        break;
      case 'seo_fields_check':
        instructions.push(
          '  -> SEO_TITLE max 60 chars, SEO_DESCRIPTION max 155 chars. Both must be non-empty.',
        );
        break;
      case 'social_content_check':
        instructions.push(
          '  -> Include at least a 3-tweet TWITTER_THREAD. Each tweet under 280 characters.',
        );
        break;
    }

    instructions.push('');
  }

  return instructions.join('\n');
}

// ─── Internal validators ──────────────────────────────────

/**
 * Validate that the slug follows URL-safe formatting rules.
 */
function validateSlugFormat(slug: string): CheckResult {
  const issues: string[] = [];

  if (slug !== slug.toLowerCase()) {
    issues.push('Slug must be lowercase.');
  }

  if (/[^a-z0-9-]/.test(slug)) {
    issues.push('Slug contains invalid characters (only a-z, 0-9, - allowed).');
  }

  if (slug.split('-').length > 10) {
    issues.push('Slug is too long (max ~8-10 words).');
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    issues.push('Slug should not start or end with a hyphen.');
  }

  if (issues.length > 0) {
    return {
      name: 'slug_format_check',
      passed: false,
      message: issues.join(' '),
      severity: 'warning',
    };
  }

  return {
    name: 'slug_format_check',
    passed: true,
    message: 'Slug format is valid.',
    severity: 'info',
  };
}

/**
 * Validate SEO metadata fields are within acceptable limits.
 */
function validateSeoFields(article: Article): CheckResult {
  const issues: string[] = [];

  if (!article.seoTitle) {
    issues.push('SEO title is empty.');
  } else if (article.seoTitle.length > 60) {
    issues.push(`SEO title is ${article.seoTitle.length} chars (max 60).`);
  }

  if (!article.seoDescription) {
    issues.push('SEO description is empty.');
  } else if (article.seoDescription.length > 155) {
    issues.push(
      `SEO description is ${article.seoDescription.length} chars (max 155).`,
    );
  }

  if (!article.excerpt) {
    issues.push('Excerpt is empty.');
  }

  if (issues.length > 0) {
    return {
      name: 'seo_fields_check',
      passed: false,
      message: issues.join(' '),
      severity: 'warning',
    };
  }

  return {
    name: 'seo_fields_check',
    passed: true,
    message: 'SEO fields are valid.',
    severity: 'info',
  };
}

/**
 * Validate that social content has at minimum a Twitter thread.
 */
function validateSocialContent(article: Article): CheckResult {
  const issues: string[] = [];
  const social = article.socialContent;

  if (!social.twitter || social.twitter.length === 0) {
    issues.push('No Twitter thread generated.');
  } else if (social.twitter.length < 3) {
    issues.push(`Twitter thread has only ${social.twitter.length} tweets (minimum 3).`);
  }

  // Check individual tweet length
  if (social.twitter) {
    const longTweets = social.twitter.filter((t) => t.length > 280);
    if (longTweets.length > 0) {
      issues.push(`${longTweets.length} tweet(s) exceed 280 character limit.`);
    }
  }

  // Bluesky post length check
  if (social.bluesky) {
    const longPosts = social.bluesky.filter((p) => p.length > 300);
    if (longPosts.length > 0) {
      issues.push(`${longPosts.length} Bluesky post(s) exceed 300 character limit.`);
    }
  }

  if (issues.length > 0) {
    return {
      name: 'social_content_check',
      passed: false,
      message: issues.join(' '),
      severity: 'warning',
    };
  }

  return {
    name: 'social_content_check',
    passed: true,
    message: 'Social content is valid.',
    severity: 'info',
  };
}
