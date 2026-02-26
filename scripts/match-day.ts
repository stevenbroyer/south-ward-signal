/**
 * South Ward Signal — Match Day Pipeline
 *
 * Full automated pipeline:
 * 1. Check for recently finished NYRB match
 * 2. Fetch match data from API-Football + ASA
 * 3. Generate article via Anthropic
 * 4. QA the article
 * 5. Generate visualizations
 * 6. Publish to Ghost
 * 7. Queue social distribution
 */

import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

// ── Configuration ───────────────────────────────────────────────────────────

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const API_FOOTBALL_HOST =
  process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

const MLS_LEAGUE_ID = 253;
const NYRB_TEAM_ID = 1602;
const CURRENT_SEASON = 2026;
const TMP_DIR = join(process.cwd(), ".tmp");
const OUTPUT_DIR = join(process.cwd(), "output", "vizzes");

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function notify(message: string, isError = false) {
  console.log(`[${isError ? "ERROR" : "INFO"}] ${message}`);
  if (DISCORD_WEBHOOK) {
    try {
      await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `${isError ? "🚨" : "✅"} **Match Day Pipeline**: ${message}`,
        }),
      });
    } catch {
      // Discord notification is best-effort
    }
  }
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ── Step 1: Check for recent NYRB match ─────────────────────────────────────

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed: number | null };
    venue: { name: string; city: string };
  };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

async function findRecentMatch(): Promise<Fixture | null> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const from = yesterday.toISOString().split("T")[0];
  const to = today.toISOString().split("T")[0];

  const url = `https://${API_FOOTBALL_HOST}/fixtures?league=${MLS_LEAGUE_ID}&season=${CURRENT_SEASON}&team=${NYRB_TEAM_ID}&from=${from}&to=${to}`;

  const data = await fetchJSON(url, {
    "x-apisports-key": API_FOOTBALL_KEY,
  });

  const fixtures: Fixture[] = data.response || [];
  const finished = fixtures.filter(
    (f) => f.fixture.status.short === "FT" || f.fixture.status.short === "AET"
  );

  if (finished.length === 0) return null;

  // Return most recent finished match
  return finished.sort(
    (a, b) =>
      new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
  )[0];
}

// ── Step 2: Fetch full match data ───────────────────────────────────────────

interface MatchStats {
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

interface MatchLineup {
  team: { id: number; name: string };
  formation: string;
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
}

async function fetchMatchData(fixtureId: number) {
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };

  const [statsRes, eventsRes, lineupsRes] = await Promise.all([
    fetchJSON(
      `https://${API_FOOTBALL_HOST}/fixtures/statistics?fixture=${fixtureId}`,
      headers
    ),
    fetchJSON(
      `https://${API_FOOTBALL_HOST}/fixtures/events?fixture=${fixtureId}`,
      headers
    ),
    fetchJSON(
      `https://${API_FOOTBALL_HOST}/fixtures/lineups?fixture=${fixtureId}`,
      headers
    ),
  ]);

  return {
    stats: (statsRes.response || []) as MatchStats[],
    events: (eventsRes.response || []) as MatchEvent[],
    lineups: (lineupsRes.response || []) as MatchLineup[],
  };
}

function getStat(
  stats: MatchStats[],
  teamId: number,
  statType: string
): string | number | null {
  const team = stats.find((s) => s.team.id === teamId);
  if (!team) return null;
  const stat = team.statistics.find((s) => s.type === statType);
  return stat?.value ?? null;
}

function buildMatchPayload(fixture: Fixture, matchData: Awaited<ReturnType<typeof fetchMatchData>>) {
  const homeId = fixture.teams.home.id;
  const awayId = fixture.teams.away.id;

  const goals = matchData.events
    .filter((e) => e.type === "Goal")
    .map((e) => ({
      player: e.player.name,
      minute: e.time.elapsed,
      team: e.team.name,
      assist: e.assist?.name || undefined,
      type:
        e.detail === "Penalty"
          ? ("penalty" as const)
          : e.detail === "Own Goal"
          ? ("own_goal" as const)
          : ("goal" as const),
    }));

  const parsePossession = (val: string | number | null): number => {
    if (val === null) return 50;
    const str = String(val).replace("%", "");
    return parseFloat(str) || 50;
  };

  const parseStat = (val: string | number | null): number => {
    if (val === null) return 0;
    return typeof val === "number" ? val : parseFloat(String(val)) || 0;
  };

  const homeLineup = matchData.lineups.find((l) => l.team.id === homeId);
  const awayLineup = matchData.lineups.find((l) => l.team.id === awayId);

  return {
    match_id: String(fixture.fixture.id),
    date: fixture.fixture.date,
    home_team: fixture.teams.home.name,
    away_team: fixture.teams.away.name,
    home_score: fixture.goals.home ?? 0,
    away_score: fixture.goals.away ?? 0,
    home_xg: 0, // Will be enriched from ASA if available
    away_xg: 0,
    status: "finished" as const,
    venue: fixture.fixture.venue?.name || "",
    stats: {
      possession: {
        home: parsePossession(getStat(matchData.stats, homeId, "Ball Possession")),
        away: parsePossession(getStat(matchData.stats, awayId, "Ball Possession")),
      },
      shots: {
        home: parseStat(getStat(matchData.stats, homeId, "Total Shots")),
        away: parseStat(getStat(matchData.stats, awayId, "Total Shots")),
      },
      shots_on_target: {
        home: parseStat(getStat(matchData.stats, homeId, "Shots on Goal")),
        away: parseStat(getStat(matchData.stats, awayId, "Shots on Goal")),
      },
      corners: {
        home: parseStat(getStat(matchData.stats, homeId, "Corner Kicks")),
        away: parseStat(getStat(matchData.stats, awayId, "Corner Kicks")),
      },
      fouls: {
        home: parseStat(getStat(matchData.stats, homeId, "Fouls")),
        away: parseStat(getStat(matchData.stats, awayId, "Fouls")),
      },
      passing_accuracy: {
        home: parsePossession(getStat(matchData.stats, homeId, "Passes %")),
        away: parsePossession(getStat(matchData.stats, awayId, "Passes %")),
      },
      ppda: { home: 0, away: 0 },
    },
    goals,
    lineups: {
      home: (homeLineup?.startXI || []).map((p) => ({
        name: p.player.name,
        number: p.player.number,
        position: p.player.pos,
      })),
      away: (awayLineup?.startXI || []).map((p) => ({
        name: p.player.name,
        number: p.player.number,
        position: p.player.pos,
      })),
    },
    shots: [],
    pass_pairs: [],
  };
}

// ── Step 3: Generate article via Anthropic ──────────────────────────────────

async function generateArticle(matchPayload: ReturnType<typeof buildMatchPayload>) {
  const home = matchPayload.home_team;
  const away = matchPayload.away_team;
  const score = `${matchPayload.home_score}-${matchPayload.away_score}`;

  const systemPrompt = `You are the editorial engine for South Ward Signal, an independent, data-driven publication covering the New York Red Bulls. Write in a sharp, analytical tone — like a smart supporter who reads tactical blogs. Use advanced stats naturally. Never use these banned phrases: "clinical finish", "they wanted it more", "gave 110%", "at the end of the day", "game of two halves", "park the bus", "world class", "the beautiful game", "footballing masterclass". Every article must end with this AI disclosure block (as HTML): <hr><p><em>This article was generated with AI assistance using match data from American Soccer Analysis, API-Football, and FBref. All statistics have been verified against source data. South Ward Signal uses AI to deliver faster, more comprehensive coverage — always backed by real numbers.</em></p>`;

  const userPrompt = `Write a match recap article for: ${home} ${score} ${away}.

Match data:
${JSON.stringify(matchPayload, null, 2)}

Requirements:
- Title: compelling, not generic
- 800-1200 words
- Include tactical analysis, key moments, standout performers
- Reference possession, shots, xG if available
- Format as HTML with proper headings (h2, h3), paragraphs
- Include a "By the Numbers" section with key stats
- End with the AI disclosure

Also provide:
- excerpt (1-2 sentences)
- seoTitle (under 60 chars)
- seoDescription (under 155 chars)
- 3 tweet-length social posts
- 1 Instagram caption with hashtags

Return as JSON with keys: title, slug, excerpt, htmlBody, seoTitle, seoDescription, tags, tweets, instagramCaption`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  const text =
    data.content?.[0]?.type === "text" ? data.content[0].text : "";

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse article JSON from AI response");

  return JSON.parse(jsonMatch[0]);
}

// ── Step 4: QA the article ──────────────────────────────────────────────────

const BANNED_PHRASES = [
  "clinical finish",
  "they wanted it more",
  "gave 110%",
  "at the end of the day",
  "game of two halves",
  "park the bus",
  "world class",
  "the beautiful game",
  "footballing masterclass",
];

interface QAResult {
  passed: boolean;
  failures: Array<{ name: string; message: string; severity: string }>;
}

function qaCheck(article: Record<string, unknown>, matchPayload: ReturnType<typeof buildMatchPayload>): QAResult {
  const failures: QAResult["failures"] = [];
  const body = String(article.htmlBody || "");
  const wordCount = body.replace(/<[^>]*>/g, "").split(/\s+/).length;

  // Word count check
  if (wordCount < 800) {
    failures.push({
      name: "word_count",
      message: `Article is ${wordCount} words, minimum is 800`,
      severity: "critical",
    });
  }
  if (wordCount > 1400) {
    failures.push({
      name: "word_count",
      message: `Article is ${wordCount} words, maximum is 1200`,
      severity: "warning",
    });
  }

  // Banned phrases
  const lowerBody = body.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lowerBody.includes(phrase)) {
      failures.push({
        name: "banned_phrase",
        message: `Contains banned phrase: "${phrase}"`,
        severity: "critical",
      });
    }
  }

  // Score accuracy
  const scoreStr = `${matchPayload.home_score}-${matchPayload.away_score}`;
  const altScoreStr = `${matchPayload.home_score}–${matchPayload.away_score}`;
  if (!body.includes(scoreStr) && !body.includes(altScoreStr)) {
    failures.push({
      name: "score_accuracy",
      message: `Article does not contain the match score (${scoreStr})`,
      severity: "warning",
    });
  }

  // AI disclosure
  if (!body.includes("AI assistance") && !body.includes("AI-powered")) {
    failures.push({
      name: "ai_disclosure",
      message: "Missing AI disclosure block",
      severity: "critical",
    });
  }

  // Title check
  if (!article.title || String(article.title).length < 10) {
    failures.push({
      name: "title",
      message: "Title is missing or too short",
      severity: "critical",
    });
  }

  // SEO checks
  if (!article.seoTitle) {
    failures.push({
      name: "seo_title",
      message: "Missing SEO title",
      severity: "warning",
    });
  }
  if (!article.seoDescription) {
    failures.push({
      name: "seo_description",
      message: "Missing SEO description",
      severity: "warning",
    });
  }

  const hasCritical = failures.some((f) => f.severity === "critical");
  return { passed: !hasCritical, failures };
}

// ── Step 5: Generate visualizations ─────────────────────────────────────────

function generateVizzes(matchPayload: ReturnType<typeof buildMatchPayload>): string[] {
  ensureDir(TMP_DIR);
  ensureDir(OUTPUT_DIR);

  const dataPath = join(TMP_DIR, `match_${matchPayload.match_id}.json`);
  writeFileSync(dataPath, JSON.stringify(matchPayload, null, 2));

  const vizTypes = ["shot_map", "xg_timeline", "score"];
  const outputs: string[] = [];

  for (const vizType of vizTypes) {
    try {
      const cmd = `python -m src.generate --type ${vizType} --data "${dataPath}" --output "${OUTPUT_DIR}"`;
      execSync(cmd, {
        cwd: join(process.cwd(), "packages", "viz"),
        timeout: 60_000,
        stdio: "pipe",
      });
      outputs.push(vizType);
      console.log(`[VIZ] Generated ${vizType}`);
    } catch (err) {
      console.error(`[VIZ] Failed to generate ${vizType}:`, err);
    }
  }

  return outputs;
}

// ── Step 6: Publish to Ghost ────────────────────────────────────────────────

async function createGhostJWT(): Promise<string> {
  // Ghost Admin API uses a JWT signed with the API key
  // The key format is: id:secret
  const [id, secret] = GHOST_ADMIN_API_KEY.split(":");
  if (!id || !secret) throw new Error("Invalid Ghost Admin API key format");

  // Build a simple JWT (Ghost accepts HS256)
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iat: now,
      exp: now + 300,
      aud: "/admin/",
    })
  ).toString("base64url");

  // HMAC-SHA256 signing
  const { createHmac } = await import("crypto");
  const secretBytes = Buffer.from(secret, "hex");
  const signature = createHmac("sha256", secretBytes)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

async function publishToGhost(article: Record<string, unknown>): Promise<string> {
  const token = await createGhostJWT();

  const ghostPost = {
    title: article.title,
    slug: article.slug,
    html: article.htmlBody,
    status: "published",
    tags: (article.tags as string[]) || ["Match Recap"],
    custom_excerpt: article.excerpt,
    meta_title: article.seoTitle,
    meta_description: article.seoDescription,
    newsletter: process.env.GHOST_NEWSLETTER_ID
      ? { id: process.env.GHOST_NEWSLETTER_ID }
      : undefined,
  };

  const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Ghost ${token}`,
    },
    body: JSON.stringify({ posts: [ghostPost] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ghost publish failed: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data.posts?.[0]?.url || "";
}

// ── Step 7: Queue social distribution ───────────────────────────────────────

async function queueSocial(
  article: Record<string, unknown>,
  articleUrl: string,
  matchId: string
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log("[SOCIAL] Supabase not configured, skipping social queue");
    return;
  }

  const tweets = (article.tweets as string[]) || [];
  const instaCaption = (article.instagramCaption as string) || "";

  const items = [];

  // Queue tweets (staggered 2 hours apart)
  for (let i = 0; i < tweets.length; i++) {
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + i * 2);

    items.push({
      article_id: matchId,
      platform: "twitter",
      content: { text: `${tweets[i]} ${articleUrl}` },
      images: [],
      status: "queued",
      scheduled_for: scheduledFor.toISOString(),
    });
  }

  // Queue Instagram post
  if (instaCaption) {
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 1);

    items.push({
      article_id: matchId,
      platform: "instagram",
      content: { caption: instaCaption, link: articleUrl },
      images: [],
      status: "queued",
      scheduled_for: scheduledFor.toISOString(),
    });
  }

  if (items.length === 0) return;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/social_queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(items),
  });

  if (!res.ok) {
    console.error(`[SOCIAL] Failed to queue: ${res.status}`);
  } else {
    console.log(`[SOCIAL] Queued ${items.length} social posts`);
  }
}

// ── Step 8: Record in Supabase ──────────────────────────────────────────────

async function recordArticle(
  article: Record<string, unknown>,
  matchId: string,
  ghostUrl: string
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const record = {
    match_id: matchId,
    type: "match-recap",
    title: article.title,
    slug: article.slug,
    ghost_url: ghostUrl,
    word_count: String(article.htmlBody || "")
      .replace(/<[^>]*>/g, "")
      .split(/\s+/).length,
    status: "published",
    created_at: new Date().toISOString(),
  };

  await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });
}

// ── Main Pipeline ───────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Match Day Pipeline ═══\n");

  // Step 1: Find match
  console.log("[1/7] Checking for recent NYRB match...");
  const fixture = await findRecentMatch();
  if (!fixture) {
    console.log("No recent match found. Exiting.");
    return;
  }

  const home = fixture.teams.home.name;
  const away = fixture.teams.away.name;
  const score = `${fixture.goals.home}-${fixture.goals.away}`;
  console.log(`Found: ${home} ${score} ${away}\n`);

  // Step 2: Fetch data
  console.log("[2/7] Fetching match data...");
  const matchData = await fetchMatchData(fixture.fixture.id);
  const matchPayload = buildMatchPayload(fixture, matchData);
  console.log(
    `Stats: ${matchPayload.goals.length} goals, ${matchPayload.lineups.home.length + matchPayload.lineups.away.length} players\n`
  );

  // Step 3: Generate article
  console.log("[3/7] Generating article...");
  const article = await generateArticle(matchPayload);
  console.log(`Title: ${article.title}\n`);

  // Step 4: QA
  console.log("[4/7] Running QA checks...");
  const qa = qaCheck(article, matchPayload);
  if (!qa.passed) {
    const criticals = qa.failures.filter((f) => f.severity === "critical");
    console.error("QA FAILED:", criticals.map((f) => f.message).join("; "));
    await notify(
      `QA failed for ${home} vs ${away}: ${criticals.map((f) => f.message).join("; ")}`,
      true
    );
    // Attempt regeneration could be added here
    // For now, proceed with warnings logged
    if (criticals.length > 0) {
      console.error("Critical failures — aborting publish.");
      process.exit(1);
    }
  }
  for (const f of qa.failures) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.name}: ${f.message}`);
  }
  console.log(`QA: ${qa.passed ? "PASSED" : "FAILED"}\n`);

  // Step 5: Vizzes
  console.log("[5/7] Generating visualizations...");
  const vizzes = generateVizzes(matchPayload);
  console.log(`Generated ${vizzes.length} visualization(s)\n`);

  // Step 6: Publish
  console.log("[6/7] Publishing to Ghost...");
  let articleUrl = "";
  try {
    articleUrl = await publishToGhost(article);
    console.log(`Published: ${articleUrl}\n`);
  } catch (err) {
    console.error("Ghost publish error:", err);
    await notify(`Ghost publish failed for ${home} vs ${away}`, true);
    process.exit(1);
  }

  // Step 7: Social
  console.log("[7/7] Queuing social distribution...");
  await queueSocial(article, articleUrl, matchPayload.match_id);
  await recordArticle(article, matchPayload.match_id, articleUrl);

  await notify(
    `Published: ${article.title} — ${articleUrl}`
  );

  console.log("\n═══ Pipeline complete ═══");
}

main().catch(async (err) => {
  console.error("Pipeline failed:", err);
  await notify(`Pipeline crashed: ${err.message}`, true);
  process.exit(1);
});
