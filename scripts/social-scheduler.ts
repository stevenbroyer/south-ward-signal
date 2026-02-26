/**
 * South Ward Signal — Social Queue Processor
 *
 * Runs every 4 hours. Pulls queued items from Supabase social_queue
 * where scheduled_for <= now and status = 'queued', then posts them
 * to the appropriate platform.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || "";
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || "";
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || "";
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || "";
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || "";
const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

interface QueueItem {
  id: string;
  article_id: string;
  platform: string;
  content: Record<string, any>;
  images: string[];
  status: string;
  scheduled_for: string;
}

async function notify(msg: string, err = false) {
  console.log(`[${err ? "ERROR" : "INFO"}] ${msg}`);
  if (DISCORD_WEBHOOK) {
    try { await fetch(DISCORD_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `${err ? "🚨" : "📱"} **Social**: ${msg}` }) }); } catch {}
  }
}

async function fetchDueItems(): Promise<QueueItem[]> {
  const now = new Date().toISOString();
  const url = `${SUPABASE_URL}/rest/v1/social_queue?status=eq.queued&scheduled_for=lte.${now}&order=scheduled_for.asc&limit=20`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase fetch: ${res.status}`);
  return res.json();
}

async function updateItem(id: string, status: string, externalId?: string) {
  const body: Record<string, any> = { status };
  if (status === "posted") body.posted_at = new Date().toISOString();
  if (externalId) body.external_id = externalId;

  await fetch(`${SUPABASE_URL}/rest/v1/social_queue?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
}

// ── Twitter/X posting via OAuth 1.0a ────────────────────────────────────────

async function postToTwitter(text: string): Promise<string | null> {
  if (!TWITTER_API_KEY || !TWITTER_ACCESS_TOKEN) {
    // Fallback to Ayrshare if configured
    if (AYRSHARE_API_KEY) return postViaAyrshare("twitter", text);
    console.log("[TWITTER] No credentials configured, skipping.");
    return null;
  }

  // Use OAuth 1.0a HMAC-SHA1 for Twitter API v2
  const { createHmac, randomBytes } = await import("crypto");
  const url = "https://api.twitter.com/2/tweets";
  const method = "POST";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");

  const params: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(params).sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(TWITTER_API_SECRET)}&${encodeURIComponent(TWITTER_ACCESS_SECRET)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const authHeader = `OAuth ${Object.entries({ ...params, oauth_signature: signature })
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ")}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error(`[TWITTER] ${res.status}: ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  return data.data?.id || null;
}

// ── Ayrshare fallback ───────────────────────────────────────────────────────

async function postViaAyrshare(platform: string, text: string, imageUrls?: string[]): Promise<string | null> {
  if (!AYRSHARE_API_KEY) return null;

  const platformMap: Record<string, string[]> = {
    twitter: ["twitter"],
    instagram: ["instagram"],
    tiktok: ["tiktok"],
    bluesky: ["bluesky"],
  };

  const body: Record<string, any> = {
    post: text,
    platforms: platformMap[platform] || [platform],
  };
  if (imageUrls?.length) body.mediaUrls = imageUrls;

  const res = await fetch("https://app.ayrshare.com/api/post", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${AYRSHARE_API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[AYRSHARE] ${res.status}: ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  return data.id || data.postIds?.[0] || "ayrshare-ok";
}

// ── Platform dispatcher ─────────────────────────────────────────────────────

async function postItem(item: QueueItem): Promise<{ success: boolean; externalId?: string }> {
  const text = item.content.text || item.content.caption || JSON.stringify(item.content);

  switch (item.platform) {
    case "twitter": {
      const id = await postToTwitter(text);
      return id ? { success: true, externalId: id } : { success: false };
    }
    case "instagram":
    case "tiktok":
    case "bluesky": {
      const id = await postViaAyrshare(item.platform, text, item.images);
      return id ? { success: true, externalId: id } : { success: false };
    }
    default:
      console.log(`[SOCIAL] Unknown platform: ${item.platform}`);
      return { success: false };
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Social Queue ═══\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log("Supabase not configured. Exiting.");
    return;
  }

  const items = await fetchDueItems();
  console.log(`Found ${items.length} due item(s) in queue.\n`);

  let posted = 0;
  let failed = 0;

  for (const item of items) {
    console.log(`Processing: ${item.platform} — ${item.id}`);
    try {
      const result = await postItem(item);
      if (result.success) {
        await updateItem(item.id, "posted", result.externalId);
        posted++;
        console.log(`  Posted (${result.externalId})`);
      } else {
        await updateItem(item.id, "failed");
        failed++;
        console.log(`  Failed`);
      }
    } catch (err) {
      await updateItem(item.id, "failed");
      failed++;
      console.error(`  Error:`, err);
    }

    // Rate limit buffer between posts
    await new Promise((r) => setTimeout(r, 2000));
  }

  const summary = `Processed ${items.length}: ${posted} posted, ${failed} failed`;
  console.log(`\n${summary}`);
  if (posted > 0 || failed > 0) await notify(summary, failed > posted);

  console.log("\n═══ Social queue complete ═══");
}

main().catch(async (err) => { console.error(err); await notify(`Crashed: ${err.message}`, true); process.exit(1); });
