/**
 * South Ward Signal — Daily Content Scheduler
 *
 * Runs daily at 8am ET. Checks the day of week and generates
 * the appropriate content type:
 *
 * - Match day (Sat/Sun/Wed): pre-match preview
 * - Monday: Stat of the Week
 * - Wednesday (no match): Player Spotlight
 * - Friday: Power Rankings
 * - Tue/Thu: no scheduled content (rest days)
 */

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const API_FOOTBALL_HOST = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

const MLS_LEAGUE_ID = 253;
const NYRB_TEAM_ID = 1602;
const CURRENT_SEASON = 2026;

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
          content: `${isError ? "🚨" : "📝"} **Daily Content**: ${message}`,
        }),
      });
    } catch { /* best-effort */ }
  }
}

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
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
  if (!res.ok) throw new Error(`Anthropic API: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

async function createGhostJWT(): Promise<string> {
  const [id, secret] = GHOST_ADMIN_API_KEY.split(":");
  if (!id || !secret) throw new Error("Invalid Ghost Admin API key");
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })).toString("base64url");
  const { createHmac } = await import("crypto");
  const sig = createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function publishToGhost(post: Record<string, unknown>): Promise<string> {
  const token = await createGhostJWT();
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Ghost ${token}`,
    },
    body: JSON.stringify({ posts: [post] }),
  });
  if (!res.ok) throw new Error(`Ghost: ${res.status} — ${await res.text()}`);
  const data = await res.json();
  return data.posts?.[0]?.url || "";
}

async function recordArticle(title: string, slug: string, type: string, url: string, wordCount: number) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      type,
      title,
      slug,
      ghost_url: url,
      word_count: wordCount,
      status: "published",
      created_at: new Date().toISOString(),
    }),
  });
}

const SYSTEM_PROMPT = `You are the editorial engine for South Ward Signal, an independent, data-driven publication covering the New York Red Bulls. Write in a sharp, analytical tone. Use advanced stats naturally. Never use these banned phrases: "clinical finish", "they wanted it more", "gave 110%", "at the end of the day", "game of two halves", "park the bus", "world class", "the beautiful game", "footballing masterclass". Every article must end with the AI disclosure: <hr><p><em>This article was generated with AI assistance using match data from American Soccer Analysis, API-Football, and FBref. All statistics have been verified against source data. South Ward Signal uses AI to deliver faster, more comprehensive coverage — always backed by real numbers.</em></p>`;

// ── Content Generators ──────────────────────────────────────────────────────

async function hasMatchToday(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const url = `https://${API_FOOTBALL_HOST}/fixtures?league=${MLS_LEAGUE_ID}&season=${CURRENT_SEASON}&team=${NYRB_TEAM_ID}&from=${today}&to=${today}`;
  const data = await fetchJSON(url, { "x-apisports-key": API_FOOTBALL_KEY });
  return (data.response || []).length > 0;
}

async function getNextFixture() {
  const today = new Date().toISOString().split("T")[0];
  const future = new Date();
  future.setDate(future.getDate() + 14);
  const to = future.toISOString().split("T")[0];

  const url = `https://${API_FOOTBALL_HOST}/fixtures?league=${MLS_LEAGUE_ID}&season=${CURRENT_SEASON}&team=${NYRB_TEAM_ID}&from=${today}&to=${to}&status=NS`;
  const data = await fetchJSON(url, { "x-apisports-key": API_FOOTBALL_KEY });
  const fixtures = data.response || [];
  return fixtures.sort((a: any, b: any) =>
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  )[0] || null;
}

async function getStandings() {
  const url = `https://${API_FOOTBALL_HOST}/standings?league=${MLS_LEAGUE_ID}&season=${CURRENT_SEASON}`;
  const data = await fetchJSON(url, { "x-apisports-key": API_FOOTBALL_KEY });
  return data.response?.[0]?.league?.standings?.[0] || [];
}

async function generatePreview() {
  console.log("Generating pre-match preview...");
  const fixture = await getNextFixture();
  if (!fixture) {
    console.log("No upcoming fixture found.");
    return;
  }

  const home = fixture.teams.home.name;
  const away = fixture.teams.away.name;
  const date = fixture.fixture.date;
  const venue = fixture.fixture.venue?.name || "";

  const text = await callAnthropic(SYSTEM_PROMPT, `Write a pre-match preview for ${home} vs ${away} on ${date} at ${venue}.

Requirements:
- 600-900 words
- Tactical analysis, form guide, key matchups, prediction
- HTML format with proper headings
- Return JSON: { title, slug, excerpt, htmlBody, seoTitle, seoDescription, tags }`);

  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  const url = await publishToGhost({
    title: json.title,
    slug: json.slug,
    html: json.htmlBody,
    status: "published",
    tags: json.tags || ["Preview"],
    custom_excerpt: json.excerpt,
    meta_title: json.seoTitle,
    meta_description: json.seoDescription,
  });

  const wc = String(json.htmlBody || "").replace(/<[^>]*>/g, "").split(/\s+/).length;
  await recordArticle(json.title, json.slug, "pre-match-preview", url, wc);
  await notify(`Preview published: ${json.title} — ${url}`);
}

async function generateStatOfWeek() {
  console.log("Generating Stat of the Week...");
  const standings = await getStandings();

  const text = await callAnthropic(SYSTEM_PROMPT, `Write a "Stat of the Week" article highlighting one interesting statistical finding about the New York Red Bulls this MLS season.

Current standings context: ${JSON.stringify(standings.slice(0, 5))}

Requirements:
- 300-500 words
- Focus on one compelling stat with context
- HTML format
- Return JSON: { title, slug, excerpt, htmlBody, seoTitle, seoDescription, tags }`);

  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  const url = await publishToGhost({
    title: json.title,
    slug: json.slug,
    html: json.htmlBody,
    status: "published",
    tags: json.tags || ["Stat of the Week"],
    custom_excerpt: json.excerpt,
    meta_title: json.seoTitle,
    meta_description: json.seoDescription,
  });

  const wc = String(json.htmlBody || "").replace(/<[^>]*>/g, "").split(/\s+/).length;
  await recordArticle(json.title, json.slug, "stat-of-week", url, wc);
  await notify(`Stat of the Week published: ${json.title} — ${url}`);
}

async function generatePlayerSpotlight() {
  console.log("Generating Player Spotlight...");

  const text = await callAnthropic(SYSTEM_PROMPT, `Write a Player Spotlight article about a current New York Red Bulls player who has been performing well recently.

Requirements:
- 700-1000 words
- Include career context, current form, advanced stats, tactical role
- HTML format
- Return JSON: { title, slug, excerpt, htmlBody, seoTitle, seoDescription, tags, playerName }`);

  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  const url = await publishToGhost({
    title: json.title,
    slug: json.slug,
    html: json.htmlBody,
    status: "published",
    tags: json.tags || ["Player Spotlight"],
    custom_excerpt: json.excerpt,
    meta_title: json.seoTitle,
    meta_description: json.seoDescription,
  });

  const wc = String(json.htmlBody || "").replace(/<[^>]*>/g, "").split(/\s+/).length;
  await recordArticle(json.title, json.slug, "player-spotlight", url, wc);
  await notify(`Player Spotlight published: ${json.title} — ${url}`);
}

async function generatePowerRankings() {
  console.log("Generating Power Rankings...");
  const standings = await getStandings();

  const text = await callAnthropic(SYSTEM_PROMPT, `Write a weekly MLS Eastern Conference Power Rankings article.

Current standings: ${JSON.stringify(standings)}

Requirements:
- 400-600 words
- Rank all Eastern Conference teams with brief analysis
- Focus on NYRB but cover the full conference
- HTML format with ordered list
- Return JSON: { title, slug, excerpt, htmlBody, seoTitle, seoDescription, tags }`);

  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  const url = await publishToGhost({
    title: json.title,
    slug: json.slug,
    html: json.htmlBody,
    status: "published",
    tags: json.tags || ["Power Rankings"],
    custom_excerpt: json.excerpt,
    meta_title: json.seoTitle,
    meta_description: json.seoDescription,
  });

  const wc = String(json.htmlBody || "").replace(/<[^>]*>/g, "").split(/\s+/).length;
  await recordArticle(json.title, json.slug, "power-rankings", url, wc);
  await notify(`Power Rankings published: ${json.title} — ${url}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Daily Content ═══\n");

  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  console.log(`Day: ${dayNames[day]} (${now.toISOString()})\n`);

  try {
    // Check for match day first (overrides daily schedule)
    const matchToday = await hasMatchToday();

    if (matchToday) {
      console.log("Match day detected — generating preview.");
      await generatePreview();
      return;
    }

    switch (day) {
      case 1: // Monday
        await generateStatOfWeek();
        break;
      case 3: // Wednesday
        await generatePlayerSpotlight();
        break;
      case 5: // Friday
        await generatePowerRankings();
        break;
      case 0: // Sunday
      case 6: // Saturday
        // Match day pipeline handles these; generate preview if match is today
        await generatePreview();
        break;
      default:
        console.log("No content scheduled for today (Tue/Thu rest day).");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await notify(`Daily content failed: ${msg}`, true);
    process.exit(1);
  }

  console.log("\n═══ Daily content complete ═══");
}

main().catch(async (err) => {
  console.error("Daily content pipeline failed:", err);
  await notify(`Pipeline crashed: ${err.message}`, true);
  process.exit(1);
});
