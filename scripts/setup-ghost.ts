/**
 * South Ward Signal — Ghost CMS Setup
 *
 * Programmatic Ghost configuration:
 * - Create all content tags
 * - Set site navigation
 * - Configure newsletter
 */

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";

async function createGhostJWT(): Promise<string> {
  const [id, secret] = GHOST_ADMIN_API_KEY.split(":");
  if (!id || !secret) throw new Error("Invalid GHOST_ADMIN_API_KEY format (expected id:secret)");
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })).toString("base64url");
  const { createHmac } = await import("crypto");
  const sig = createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function ghostAdmin(path: string, method = "GET", body?: unknown) {
  const token = await createGhostJWT();
  const res = await fetch(`${GHOST_URL}/ghost/api/admin${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Ghost ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ghost ${method} ${path}: ${res.status} — ${text}`);
  }
  return res.json();
}

// ── Tags ────────────────────────────────────────────────────────────────────

const TAGS = [
  { name: "Match Recap", slug: "match-recap", description: "Post-match analysis with stats and tactical breakdown", accent_color: "#ED1A3D" },
  { name: "Preview", slug: "preview", description: "Pre-match previews with form, tactics, and predictions", accent_color: "#3B82F6" },
  { name: "Player Spotlight", slug: "player-spotlight", description: "In-depth player profiles and performance analysis", accent_color: "#D4A843" },
  { name: "Power Rankings", slug: "power-rankings", description: "Weekly MLS Eastern Conference power rankings", accent_color: "#8B5CF6" },
  { name: "Transfer Intel", slug: "transfer-intel", description: "Transfer rumors, signings, and roster moves", accent_color: "#22C55E" },
  { name: "Stat of the Week", slug: "stat-of-week", description: "One standout statistical finding each week", accent_color: "#F59E0B" },
  { name: "Weekly Roundup", slug: "weekly-roundup", description: "Weekly newsletter compiling all published content", accent_color: "#EC4899" },
  { name: "NYRB", slug: "nyrb", description: "All New York Red Bulls content", accent_color: "#ED1A3D" },
  { name: "MLS", slug: "mls", description: "Major League Soccer coverage", accent_color: "#6E6E7A" },
  { name: "Data & Analytics", slug: "data-analytics", description: "Statistical analysis and data visualization", accent_color: "#3B82F6" },
];

async function createTags() {
  console.log("[TAGS] Creating content tags...");
  for (const tag of TAGS) {
    try {
      await ghostAdmin("/tags/", "POST", { tags: [tag] });
      console.log(`  Created: ${tag.name}`);
    } catch (err: any) {
      if (err.message?.includes("422") || err.message?.includes("duplicate")) {
        console.log(`  Exists:  ${tag.name}`);
      } else {
        console.error(`  Error:   ${tag.name} — ${err.message}`);
      }
    }
  }
}

// ── Navigation ──────────────────────────────────────────────────────────────

async function setNavigation() {
  console.log("\n[NAV] Setting site navigation...");

  const navigation = [
    { label: "Home", url: "/" },
    { label: "Match Recaps", url: "/tag/match-recap/" },
    { label: "Previews", url: "/tag/preview/" },
    { label: "Player Spotlights", url: "/tag/player-spotlight/" },
    { label: "Power Rankings", url: "/tag/power-rankings/" },
    { label: "Stats", url: "/tag/data-analytics/" },
  ];

  const secondaryNavigation = [
    { label: "About", url: "/about/" },
    { label: "Newsletter", url: "/#/portal/signup" },
    { label: "Twitter/X", url: "https://twitter.com/SouthWardSignal" },
    { label: "TikTok", url: "https://tiktok.com/@southwardsignal" },
  ];

  try {
    // Get current settings to find the settings id
    const settingsData = await ghostAdmin("/settings/");
    const settings = settingsData.settings || [];

    await ghostAdmin("/settings/", "PUT", {
      settings: [
        { key: "navigation", value: JSON.stringify(navigation) },
        { key: "secondary_navigation", value: JSON.stringify(secondaryNavigation) },
        { key: "title", value: "South Ward Signal" },
        { key: "description", value: "Data-driven. Supporter-born. Independent AI-powered coverage of the New York Red Bulls." },
        { key: "meta_title", value: "South Ward Signal — NYRB Coverage" },
        { key: "meta_description", value: "Independent, data-driven coverage of the New York Red Bulls. AI-powered analysis backed by real stats from ASA, FBref, and API-Football." },
        { key: "og_title", value: "South Ward Signal" },
        { key: "og_description", value: "Data-driven. Supporter-born. AI-powered NYRB coverage." },
        { key: "twitter_title", value: "South Ward Signal" },
        { key: "twitter_description", value: "Independent AI-powered New York Red Bulls coverage." },
        { key: "accent_color", value: "#ED1A3D" },
      ],
    });
    console.log("  Navigation and site settings updated.");
  } catch (err: any) {
    console.error(`  Error: ${err.message}`);
  }
}

// ── Newsletter ──────────────────────────────────────────────────────────────

async function configureNewsletter() {
  console.log("\n[NEWSLETTER] Configuring newsletter...");

  try {
    // Check existing newsletters
    const data = await ghostAdmin("/newsletters/?limit=all");
    const newsletters = data.newsletters || [];

    if (newsletters.length === 0) {
      // Create new newsletter
      const result = await ghostAdmin("/newsletters/", "POST", {
        newsletters: [{
          name: "The Signal",
          description: "Weekly NYRB coverage — match recaps, stat breakdowns, and power rankings. Delivered every Monday.",
          sender_name: "South Ward Signal",
          sender_reply_to: "newsletter",
          status: "active",
          subscribe_on_signup: true,
          sort_order: 0,
          header_image: null,
          show_header_icon: true,
          show_header_title: true,
          show_header_name: true,
          title_font_category: "serif",
          title_alignment: "center",
          show_feature_image: true,
          body_font_category: "sans_serif",
          show_badge: true,
          show_latest_posts: true,
        }],
      });
      const nl = result.newsletters?.[0];
      console.log(`  Created newsletter: ${nl?.name} (ID: ${nl?.id})`);
      console.log(`\n  Set GHOST_NEWSLETTER_ID=${nl?.id} in your .env`);
    } else {
      console.log(`  Found ${newsletters.length} existing newsletter(s):`);
      for (const nl of newsletters) {
        console.log(`    - ${nl.name} (ID: ${nl.id}, status: ${nl.status})`);
      }
      console.log(`\n  Set GHOST_NEWSLETTER_ID=${newsletters[0].id} in your .env`);
    }
  } catch (err: any) {
    console.error(`  Error: ${err.message}`);
  }
}

// ── Create About page ───────────────────────────────────────────────────────

async function createAboutPage() {
  console.log("\n[PAGE] Creating About page...");

  const html = `
<h2>What is South Ward Signal?</h2>
<p>South Ward Signal is an independent, data-driven publication dedicated to covering the <strong>New York Red Bulls</strong>. We combine advanced analytics from American Soccer Analysis, FBref, and API-Football with AI-powered writing to deliver faster, more comprehensive coverage than traditional outlets.</p>

<h2>Our Approach</h2>
<p>Every article is backed by real data. We use expected goals (xG), goals added (g+), PPDA, and other advanced metrics to go beyond the box score. Our AI editorial engine helps us publish match recaps within minutes of the final whistle, while maintaining the analytical depth our readers expect.</p>

<h2>The Name</h2>
<p>The South Ward is where the supporters stand at Red Bull Arena. It's the heartbeat of the match-day experience — loud, passionate, and relentless. South Ward Signal channels that energy into data-driven journalism.</p>

<h2>Transparency</h2>
<p>We believe in full transparency. Every AI-generated article is clearly disclosed. All statistics are verified against source data before publication. We're not here to replace journalists — we're here to complement the coverage ecosystem with speed and analytical depth.</p>

<h3>Data Sources</h3>
<ul>
  <li><strong>American Soccer Analysis (ASA)</strong> — xG, xA, goals added, advanced team metrics</li>
  <li><strong>FBref</strong> — Comprehensive player and match statistics</li>
  <li><strong>API-Football</strong> — Real-time scores, fixtures, lineups</li>
</ul>

<h3>Contact</h3>
<p>Follow us on <a href="https://twitter.com/SouthWardSignal">Twitter/X</a> or <a href="https://tiktok.com/@southwardsignal">TikTok</a>.</p>
`;

  try {
    await ghostAdmin("/pages/", "POST", {
      pages: [{
        title: "About South Ward Signal",
        slug: "about",
        html,
        status: "published",
        meta_title: "About — South Ward Signal",
        meta_description: "Independent, data-driven NYRB coverage powered by AI and advanced analytics.",
      }],
    });
    console.log("  About page created.");
  } catch (err: any) {
    if (err.message?.includes("422")) {
      console.log("  About page already exists.");
    } else {
      console.error(`  Error: ${err.message}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Ghost Setup ═══\n");

  if (!GHOST_URL || !GHOST_ADMIN_API_KEY) {
    console.error("Set GHOST_URL and GHOST_ADMIN_API_KEY in your .env");
    process.exit(1);
  }

  console.log(`Ghost URL: ${GHOST_URL}\n`);

  await createTags();
  await setNavigation();
  await configureNewsletter();
  await createAboutPage();

  console.log("\n═══ Ghost setup complete ═══");
  console.log("\nNext steps:");
  console.log("  1. Set GHOST_NEWSLETTER_ID in .env");
  console.log("  2. Upload logo/favicon in Ghost Admin > Design");
  console.log("  3. Configure a custom theme or use the default");
  console.log("  4. Set up a custom domain in Ghost Admin > Settings");
}

main().catch((err) => { console.error("Setup failed:", err); process.exit(1); });
