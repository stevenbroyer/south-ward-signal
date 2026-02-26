/**
 * South Ward Signal — Weekly Roundup
 *
 * Runs Monday 7am ET. Compiles all articles published in the past 7 days
 * into a newsletter-style roundup and publishes to Ghost with newsletter enabled.
 */

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";
const GHOST_CONTENT_API_KEY = process.env.GHOST_CONTENT_API_KEY || "";
const GHOST_NEWSLETTER_ID = process.env.GHOST_NEWSLETTER_ID || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function notify(msg: string, err = false) {
  console.log(`[${err ? "ERROR" : "INFO"}] ${msg}`);
  if (DISCORD_WEBHOOK) {
    try { await fetch(DISCORD_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `${err ? "🚨" : "📬"} **Weekly Roundup**: ${msg}` }) }); } catch {}
  }
}

async function createGhostJWT(): Promise<string> {
  const [id, secret] = GHOST_ADMIN_API_KEY.split(":");
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })).toString("base64url");
  const { createHmac } = await import("crypto");
  const sig = createHmac("sha256", Buffer.from(secret!, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function fetchRecentPosts(): Promise<any[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const filter = `published_at:>'${weekAgo.toISOString().split("T")[0]}'`;
  const url = `${GHOST_URL}/ghost/api/content/posts/?key=${GHOST_CONTENT_API_KEY}&filter=${encodeURIComponent(filter)}&limit=20&include=tags&order=published_at%20desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ghost content API: ${res.status}`);
  const data = await res.json();
  return data.posts || [];
}

async function main() {
  console.log("═══ South Ward Signal — Weekly Roundup ═══\n");

  const posts = await fetchRecentPosts();
  if (posts.length === 0) {
    console.log("No posts from the past week. Skipping roundup.");
    return;
  }

  console.log(`Found ${posts.length} articles from the past week.`);

  const postSummaries = posts.map((p: any) => ({
    title: p.title,
    url: p.url,
    excerpt: p.custom_excerpt || p.excerpt || "",
    tag: p.tags?.[0]?.name || "Article",
    date: p.published_at,
  }));

  // Generate roundup via Anthropic
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: "You write the weekly newsletter for South Ward Signal, covering the New York Red Bulls. Tone: sharp, analytical, supporter-friendly. Format as clean HTML.",
      messages: [{ role: "user", content: `Compile a weekly roundup newsletter from these articles published this week:\n\n${JSON.stringify(postSummaries, null, 2)}\n\nRequirements:\n- Brief intro paragraph about the week in NYRB\n- Each article gets a short blurb with a link\n- Group by category if possible\n- Close with a "Looking Ahead" section\n- 600-1000 words total\n- End with AI disclosure\n- Return JSON: { title, slug, htmlBody, excerpt, seoTitle, seoDescription }` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic: ${res.status}`);
  const aiData = await res.json();
  const text = aiData.content?.[0]?.text || "";
  const article = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");

  // Publish to Ghost as newsletter
  const token = await createGhostJWT();
  const ghostRes = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Ghost ${token}` },
    body: JSON.stringify({
      posts: [{
        title: article.title || "South Ward Signal — Weekly Roundup",
        slug: article.slug || `weekly-roundup-${new Date().toISOString().split("T")[0]}`,
        html: article.htmlBody,
        status: "published",
        tags: ["Weekly Roundup"],
        custom_excerpt: article.excerpt,
        meta_title: article.seoTitle,
        meta_description: article.seoDescription,
        newsletter: GHOST_NEWSLETTER_ID ? { id: GHOST_NEWSLETTER_ID } : undefined,
        email_segment: "all",
      }],
    }),
  });

  if (!ghostRes.ok) throw new Error(`Ghost publish: ${ghostRes.status}`);
  const ghostData = await ghostRes.json();
  const url = ghostData.posts?.[0]?.url || "";

  // Record in Supabase
  if (SUPABASE_URL && SUPABASE_KEY) {
    await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify({ type: "weekly-roundup", title: article.title, slug: article.slug, ghost_url: url, status: "published", created_at: new Date().toISOString() }),
    });
  }

  await notify(`Published: ${article.title} — ${url}`);
  console.log("\n═══ Weekly roundup complete ═══");
}

main().catch(async (err) => { console.error(err); await notify(`Failed: ${err.message}`, true); process.exit(1); });
