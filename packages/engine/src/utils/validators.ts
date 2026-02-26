/**
 * Fact-Checking & Validation Utilities
 *
 * Functions for verifying article content against source data.
 */

import type { MatchData, Goal, CheckResult } from '@sws/shared';
import { BANNED_PHRASES, WORD_COUNT_TARGETS } from '@sws/shared';

/**
 * Extract all quoted text from an article body.
 * Matches both "double quotes" and "smart quotes".
 */
export function extractQuotes(text: string): string[] {
  const quotes: string[] = [];

  // Standard double quotes
  const standardPattern = /"([^"]{10,})"/g;
  let match: RegExpExecArray | null;
  while ((match = standardPattern.exec(text)) !== null) {
    quotes.push(match[1]);
  }

  // Smart / curly double quotes
  const smartPattern = /\u201C([^\u201D]{10,})\u201D/g;
  while ((match = smartPattern.exec(text)) !== null) {
    quotes.push(match[1]);
  }

  // Markdown blockquotes that look like speech
  const blockquotePattern = /^>\s*"?(.+?)"?\s*$/gm;
  while ((match = blockquotePattern.exec(text)) !== null) {
    const content = match[1].trim();
    if (content.length >= 10 && !content.startsWith('#')) {
      quotes.push(content);
    }
  }

  return quotes;
}

/**
 * Fuzzy string match using Levenshtein distance normalized to [0, 1].
 * Returns 1.0 for exact match, 0.0 for completely different.
 */
export function fuzzyMatch(a: string, b: string): number {
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();

  if (strA === strB) return 1.0;
  if (strA.length === 0 || strB.length === 0) return 0.0;

  const maxLen = Math.max(strA.length, strB.length);
  const distance = levenshtein(strA, strB);
  return 1.0 - distance / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/**
 * Validate that the score mentioned in the article matches the actual data.
 * Searches for common score formats: "3-1", "3:1", "three-one" etc.
 */
export function validateScore(
  articleText: string,
  matchData: MatchData,
): CheckResult {
  const expectedHome = matchData.home_score;
  const expectedAway = matchData.away_score;

  // Patterns to find scores in text
  const scorePatterns = [
    // "3-1", "3 - 1"
    /(\d+)\s*[-\u2013\u2014]\s*(\d+)/g,
    // "3:1"
    /(\d+):(\d+)/g,
  ];

  const foundScores: Array<{ home: number; away: number; raw: string }> = [];

  for (const pattern of scorePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(articleText)) !== null) {
      const num1 = parseInt(match[1], 10);
      const num2 = parseInt(match[2], 10);
      // Skip scores that are clearly not match scores (e.g. minute ranges like "45-50")
      if (num1 <= 20 && num2 <= 20) {
        foundScores.push({ home: num1, away: num2, raw: match[0] });
      }
    }
  }

  if (foundScores.length === 0) {
    return {
      name: 'score_check',
      passed: false,
      message: 'No match score found in article text.',
      severity: 'critical',
    };
  }

  // Check if any found score matches the correct one (home-away or away-home)
  const correctForward = foundScores.some(
    (s) => s.home === expectedHome && s.away === expectedAway,
  );
  const correctReverse = foundScores.some(
    (s) => s.home === expectedAway && s.away === expectedHome,
  );

  if (correctForward || correctReverse) {
    // Verify all scores in the article are consistent
    const inconsistent = foundScores.filter(
      (s) =>
        !(s.home === expectedHome && s.away === expectedAway) &&
        !(s.home === expectedAway && s.away === expectedHome),
    );

    if (inconsistent.length > 0) {
      return {
        name: 'score_check',
        passed: false,
        message: `Article contains inconsistent scores: ${inconsistent.map((s) => s.raw).join(', ')}. Expected ${expectedHome}-${expectedAway}.`,
        severity: 'critical',
      };
    }

    return {
      name: 'score_check',
      passed: true,
      message: `Score ${expectedHome}-${expectedAway} correctly reported.`,
      severity: 'info',
    };
  }

  return {
    name: 'score_check',
    passed: false,
    message: `Score mismatch. Expected ${expectedHome}-${expectedAway}, found: ${foundScores.map((s) => s.raw).join(', ')}.`,
    severity: 'critical',
  };
}

/**
 * Validate that goal scorers mentioned in the article match the actual data.
 */
export function validateGoalScorers(
  articleText: string,
  goals: Goal[],
): CheckResult {
  const textLower = articleText.toLowerCase();
  const missingScorers: string[] = [];

  for (const goal of goals) {
    // Check if player name (or last name) appears in the article
    const fullName = goal.player.toLowerCase();
    const lastName = fullName.split(' ').pop() || fullName;

    const nameFound =
      textLower.includes(fullName) || textLower.includes(lastName);

    if (!nameFound) {
      missingScorers.push(goal.player);
    }
  }

  if (missingScorers.length > 0) {
    return {
      name: 'goal_scorers_check',
      passed: false,
      message: `Goal scorers missing from article: ${missingScorers.join(', ')}.`,
      severity: 'critical',
    };
  }

  return {
    name: 'goal_scorers_check',
    passed: true,
    message: 'All goal scorers mentioned in article.',
    severity: 'info',
  };
}

/**
 * Validate team names are used correctly.
 */
export function validateNames(
  articleText: string,
  matchData: MatchData,
): CheckResult {
  const issues: string[] = [];

  // Check that "New York" alone isn't used (ambiguous with NYCFC)
  // Allow "New York Red Bulls" and "New York City FC"
  const ambiguousPattern = /\bNew York\b(?!\s+Red Bulls|\s+City|\s+FC|\s+RBNY)/gi;
  const ambiguousMatches = articleText.match(ambiguousPattern);
  if (ambiguousMatches && ambiguousMatches.length > 0) {
    issues.push(
      `Found "${ambiguousMatches[0]}" used ambiguously (could mean NYRB or NYCFC). Use "New York Red Bulls", "NYRB", or "the Red Bulls" instead.`,
    );
  }

  // Check that team names from the match are referenced
  const textLower = articleText.toLowerCase();
  const homeTeam = matchData.home_team.toLowerCase();
  const awayTeam = matchData.away_team.toLowerCase();

  // Allow partial matches (e.g. "Red Bulls" for "New York Red Bulls")
  const homeWords = homeTeam.split(' ');
  const awayWords = awayTeam.split(' ');

  const homeFound =
    textLower.includes(homeTeam) ||
    homeWords.some((w) => w.length > 3 && textLower.includes(w));
  const awayFound =
    textLower.includes(awayTeam) ||
    awayWords.some((w) => w.length > 3 && textLower.includes(w));

  if (!homeFound) {
    issues.push(`Home team "${matchData.home_team}" not mentioned in article.`);
  }
  if (!awayFound) {
    issues.push(`Away team "${matchData.away_team}" not mentioned in article.`);
  }

  if (issues.length > 0) {
    return {
      name: 'team_names_check',
      passed: false,
      message: issues.join(' '),
      severity: issues.some((i) => i.includes('not mentioned'))
        ? 'critical'
        : 'warning',
    };
  }

  return {
    name: 'team_names_check',
    passed: true,
    message: 'Team names used correctly.',
    severity: 'info',
  };
}

/**
 * Check for banned phrases / cliches.
 */
export function checkBannedPhrases(articleText: string): CheckResult {
  const textLower = articleText.toLowerCase();
  const found: string[] = [];

  for (const phrase of BANNED_PHRASES) {
    if (textLower.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }

  if (found.length > 0) {
    return {
      name: 'banned_phrases_check',
      passed: false,
      message: `Banned phrases found: ${found.map((p) => `"${p}"`).join(', ')}.`,
      severity: 'warning',
    };
  }

  return {
    name: 'banned_phrases_check',
    passed: true,
    message: 'No banned phrases found.',
    severity: 'info',
  };
}

/**
 * Check word count against targets for the article type.
 */
export function checkWordCount(
  articleText: string,
  articleType: string,
): CheckResult {
  const words = articleText
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const count = words.length;

  const target = WORD_COUNT_TARGETS[articleType];
  if (!target) {
    return {
      name: 'word_count_check',
      passed: true,
      message: `Word count: ${count} (no target for type "${articleType}").`,
      severity: 'info',
    };
  }

  if (count < target.min) {
    return {
      name: 'word_count_check',
      passed: false,
      message: `Article too short: ${count} words (minimum ${target.min}).`,
      severity: 'warning',
    };
  }

  if (count > target.max) {
    return {
      name: 'word_count_check',
      passed: false,
      message: `Article too long: ${count} words (maximum ${target.max}).`,
      severity: 'warning',
    };
  }

  return {
    name: 'word_count_check',
    passed: true,
    message: `Word count: ${count} (target: ${target.min}-${target.max}).`,
    severity: 'info',
  };
}

/**
 * Verify that quotes in the article match provided press conference quotes.
 * Returns a failure if quotes appear to be fabricated.
 */
export function validateQuotes(
  articleText: string,
  providedQuotes: Array<{ text: string; speaker: string }> | undefined,
): CheckResult {
  const articleQuotes = extractQuotes(articleText);

  if (articleQuotes.length === 0) {
    return {
      name: 'quotes_check',
      passed: true,
      message: 'No quotes found in article.',
      severity: 'info',
    };
  }

  if (!providedQuotes || providedQuotes.length === 0) {
    // Article has quotes but no quotes were provided -- potential fabrication
    return {
      name: 'quotes_check',
      passed: false,
      message: `Article contains ${articleQuotes.length} quote(s) but no source quotes were provided. Possible fabrication.`,
      severity: 'critical',
    };
  }

  // Check each article quote against provided quotes using fuzzy matching
  const unmatched: string[] = [];

  for (const articleQuote of articleQuotes) {
    let bestMatch = 0;
    for (const provided of providedQuotes) {
      const similarity = fuzzyMatch(articleQuote, provided.text);
      bestMatch = Math.max(bestMatch, similarity);
    }
    // Threshold: at least 60% match to be considered sourced
    if (bestMatch < 0.6) {
      unmatched.push(
        articleQuote.length > 60
          ? articleQuote.slice(0, 60) + '...'
          : articleQuote,
      );
    }
  }

  if (unmatched.length > 0) {
    return {
      name: 'quotes_check',
      passed: false,
      message: `${unmatched.length} potentially fabricated quote(s): "${unmatched[0]}"${unmatched.length > 1 ? ` and ${unmatched.length - 1} more` : ''}.`,
      severity: 'critical',
    };
  }

  return {
    name: 'quotes_check',
    passed: true,
    message: `All ${articleQuotes.length} quote(s) matched to source data.`,
    severity: 'info',
  };
}

/**
 * Check that the AI disclosure block is present.
 */
export function checkAIDisclosure(articleHtml: string): CheckResult {
  const hasDisclosure =
    articleHtml.includes('generated with AI assistance') ||
    articleHtml.includes('AI assistance');

  return {
    name: 'ai_disclosure_check',
    passed: hasDisclosure,
    message: hasDisclosure
      ? 'AI disclosure present.'
      : 'Missing AI disclosure block at end of article.',
    severity: hasDisclosure ? 'info' : 'critical',
  };
}

/**
 * Validate that stat claims in the article can be traced to the data.
 * Looks for percentage patterns and cross-references with match stats.
 */
export function validateStatClaims(
  articleText: string,
  matchData: MatchData,
): CheckResult {
  const issues: string[] = [];

  // Extract percentage claims (e.g. "63% possession")
  const pctPattern = /(\d{1,3})%\s*(possession|passing|pass\s*completion|accuracy)/gi;
  let match: RegExpExecArray | null;
  while ((match = pctPattern.exec(articleText)) !== null) {
    const value = parseInt(match[1], 10);
    const stat = match[2].toLowerCase();

    if (stat.includes('possession')) {
      const homePoss = matchData.stats.possession.home;
      const awayPoss = matchData.stats.possession.away;
      if (value !== homePoss && value !== awayPoss) {
        issues.push(
          `Possession claim "${match[0]}" doesn't match data (${homePoss}%/${awayPoss}%).`,
        );
      }
    }
    if (stat.includes('pass') || stat.includes('accuracy')) {
      const homeAcc = matchData.stats.passing_accuracy.home;
      const awayAcc = matchData.stats.passing_accuracy.away;
      if (value !== homeAcc && value !== awayAcc) {
        issues.push(
          `Passing accuracy claim "${match[0]}" doesn't match data (${homeAcc}%/${awayAcc}%).`,
        );
      }
    }
  }

  // Extract shot claims (e.g. "15 shots")
  const shotPattern = /(\d{1,2})\s*shots?\s*(?:on\s*target)?/gi;
  while ((match = shotPattern.exec(articleText)) !== null) {
    const value = parseInt(match[1], 10);
    const isOnTarget = match[0].toLowerCase().includes('on target');

    if (isOnTarget) {
      const homeSot = matchData.stats.shots_on_target.home;
      const awaySot = matchData.stats.shots_on_target.away;
      if (value !== homeSot && value !== awaySot && value !== homeSot + awaySot) {
        issues.push(
          `Shots on target claim "${match[0]}" doesn't match data (${homeSot}/${awaySot}).`,
        );
      }
    } else {
      const homeShots = matchData.stats.shots.home;
      const awayShots = matchData.stats.shots.away;
      if (
        value !== homeShots &&
        value !== awayShots &&
        value !== homeShots + awayShots
      ) {
        // Only flag if the number is "significant" (not a minute or small number)
        if (value >= 5) {
          issues.push(
            `Shots claim "${match[0]}" doesn't match data (${homeShots}/${awayShots}).`,
          );
        }
      }
    }
  }

  if (issues.length > 0) {
    return {
      name: 'stat_claims_check',
      passed: false,
      message: issues.join(' '),
      severity: 'warning',
    };
  }

  return {
    name: 'stat_claims_check',
    passed: true,
    message: 'All verifiable stat claims match source data.',
    severity: 'info',
  };
}
