# South Ward Signal -- Content Strategy

**Version:** 1.0
**Date:** March 11, 2026
**Prepared for:** Po Studios

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Content Types and Templates](#2-content-types-and-templates)
3. [Editorial Calendar and Cadence](#3-editorial-calendar-and-cadence)
4. [Ghost CMS Strategy](#4-ghost-cms-strategy)
5. [Newsletter Strategy](#5-newsletter-strategy)
6. [Community and Engagement Features](#6-community-and-engagement-features)
7. [Social Media Distribution](#7-social-media-distribution)
8. [Content Taxonomy and Organization](#8-content-taxonomy-and-organization)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Executive Summary

South Ward Signal is an independent, supporter-run media and analytics platform covering the New York Red Bulls. The platform already has a strong technical foundation: a Ghost CMS for articles, a data room with 30+ visualizations sourced from American Soccer Analysis, FBref, and API-Football, and an AI-powered content engine capable of generating match recaps, pre-match previews, player spotlights, power rankings, transfer intel, stat-of-the-week pieces, and weekly roundups.

This strategy document defines how to expand that foundation into a comprehensive content ecosystem that serves Red Bulls supporters across every phase of the MLS season, builds a loyal subscriber base, and establishes SWS as the definitive independent voice for the South Ward community.

### Core Positioning

- **Data-driven. Supporter-born.** (existing tagline -- keep it)
- Differentiated from official club media by editorial independence, advanced analytics, and supporter perspective
- Differentiated from mainstream outlets (The Athletic, ESPN) by depth of RBNY-specific coverage, community integration, and data room access
- Differentiated from fan forums (Reddit, Twitter) by editorial quality, structured analysis, and archival permanence

### Content Pillars

Every piece of content should ladder up to one of these four pillars:

1. **Match Intelligence** -- Previews, recaps, tactical analysis, and real-time coverage
2. **Deep Data** -- xG analysis, advanced metrics, player profiling, and statistical storytelling
3. **Transfer and Front Office** -- Roster moves, contract analysis, academy pipeline, and front office coverage
4. **Supporter Culture** -- South Ward identity, tifo, chants, away days, history, and community voice

---

## 2. Content Types and Templates

### 2.1 Match Recap (existing -- refine)

**Current state:** Engine template at `packages/engine/src/templates/match-recap.ts` generates 800-1200 word recaps with tactical analysis, xG breakdown, goals-added data, press quotes, and social content.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Hero image | Yes | Match action photo, 16:9 aspect, team-branded overlay |
| Tag badge | Yes | "Match Recap" in `#ED1A3D` |
| Score banner | Yes | Inline scoreline with xG comparison bar |
| Opening paragraph | Yes | Score, key narrative, 2-3 sentences |
| Tactical analysis section | Yes | PPDA, possession, pressing shape, formation dynamics |
| Key moments section | Yes | Chronological goals with xG context |
| Standout performers | Yes | 2-3 players, goals-added data, specific actions |
| "By the Numbers" stat block | Yes | 5-7 bullet-point stat takeaways |
| Match stats sidebar | Yes | Desktop right rail: possession, shots, xG, corners, fouls, PPDA |
| Player ratings widget | Future | Community-submitted ratings (see Section 6) |
| Related coverage sidebar | Yes | Links to preview, opponent analysis, player profiles |
| AI transparency disclosure | Yes | Already implemented in article template |

**Publish timing:** Within 2 hours of final whistle (AI-generated draft, human review).

---

### 2.2 Pre-Match Preview (existing -- refine)

**Current state:** Engine template at `packages/engine/src/templates/pre-match-preview.ts` generates 600-900 word previews with form guide, tactical preview, key matchups, and prediction.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Hero image | Yes | Fixture graphic with both team badges |
| Tag badge | Yes | "Preview" in `#3B82F6` |
| Fixture info bar | Yes | Date, time, venue, broadcast info, weather |
| Form guide section | Yes | Last 5 results for each team with xG |
| Tactical preview | Yes | Expected formations, stylistic clash, key tactical question |
| Key matchups (3) | Yes | Individual or unit vs. unit battles |
| Injury and availability report | Yes | Known absences, suspensions, fitness concerns |
| Prediction with reasoning | Yes | Bold scoreline pick backed by data |
| Season context callout | Optional | Playoff implications, standings impact |
| Related coverage sidebar | Yes | Previous H2H recap, player spotlights for key matchup players |

**Publish timing:** 24-36 hours before kickoff.

---

### 2.3 Tactical Analysis Deep-Dive (new)

Long-form breakdown of tactical themes. Not tied to a single match -- synthesizes trends across multiple games.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Hero image or custom tactical diagram | Yes | Formation overlay, passing network, or heat map |
| Tag badge | Yes | "Tactical Analysis" (new tag, color: `#8B5CF6`) |
| Thesis statement header | Yes | One-sentence tactical question the piece answers |
| Data visualization embed | Yes | Pull from data room: xG race chart, shot maps, passing networks |
| Narrative body (1200-2000 words) | Yes | Multi-match evidence, statistical backing |
| Annotated screenshots or diagrams | Recommended | Freeze-frame analysis of key passages of play |
| Stat comparison table | Yes | Side-by-side metrics supporting the argument |
| Conclusion and outlook | Yes | What this means for upcoming matches |

**Word count:** 1200-2000
**Cadence:** 1 per week during the season, themed around a tactical question (e.g., "Is the high press sustainable?", "Why the double pivot unlocked the attack")

---

### 2.4 Player Spotlight / Profile (existing -- expand)

**Current state:** Engine generates player spotlights. Expand into two variants.

**Variant A -- Active Player Profile (500-800 words):**

| Element | Required | Details |
|---------|----------|---------|
| Hero portrait image | Yes | Player action shot with brand overlay |
| Tag badge | Yes | "Player Spotlight" in `#D4A843` |
| Player info card | Yes | Name, number, position, age, nationality, contract status |
| Season stats table | Yes | Goals, assists, xG, xA, goals-added, minutes, key passes |
| Radar chart or comparison viz | Recommended | Pulled from data room player page |
| Narrative profile | Yes | Role in the system, strengths, development trajectory |
| Key stat callout block | Yes | One headline number with context |
| Quote block | Optional | From press conferences (only if verified and available) |

**Variant B -- Academy / Homegrown Feature (800-1200 words):**

Same structure as Variant A, plus:
- Academy pathway timeline
- Comparison to other RBNY academy graduates
- Development metrics (minutes by age, progression curve)

**Cadence:** 1 per week, alternating active roster and academy pipeline.

---

### 2.5 Transfer Intel (existing -- expand)

**Current state:** Engine generates transfer-intel articles (500-800 words).

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Hero image | Yes | Player photo or club badge |
| Tag badge | Yes | "Transfer Intel" in `#22C55E` |
| Rumor confidence meter | New | Scale of 1-5 based on source reliability |
| Player profile card | Yes | Name, age, position, current club, contract expiry |
| Statistical scouting report | Yes | Key metrics compared to current RBNY squad |
| Tactical fit analysis | Yes | How this player would fit the system |
| Financial context | Optional | Reported fee range, salary cap implications |
| Timeline of reports | Recommended | Chronological source tracking |

**Cadence:** As-needed during transfer windows (Jan 26 - Mar 26 primary; Jul 13 - Sep 2 secondary for 2026). One "Transfer Roundup" weekly during windows.

---

### 2.6 Data Deep-Dive (new)

Long-form statistical storytelling that showcases the data room capabilities.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Hero visualization | Yes | Feature data viz as hero instead of photo |
| Tag badge | Yes | "Data Deep-Dive" (new tag, color: `#F59E0B`) |
| Central question or hypothesis | Yes | Framed as a question the data will answer |
| Embedded data room visualizations | Yes | 3-5 charts/graphs inline with analysis |
| Narrative walkthrough | Yes | Explain what the data shows in accessible language |
| Methodology note | Optional | Brief explanation of metrics used (toggle/collapsible) |
| Key findings summary | Yes | 3-5 bullet takeaways |
| CTA to data room | Yes | "Explore the full data at /data-room" |

**Word count:** 800-1500
**Cadence:** Bi-weekly. This is SWS's signature differentiator.

---

### 2.7 Power Rankings (existing -- keep)

**Current state:** Engine generates 400-600 word power rankings.

**Template additions:**

| Element | Details |
|---------|---------|
| Movement indicators | Up/down/steady arrows with rank change numbers |
| Mini stat line per team | Points, form, xG differential |
| RBNY callout block | Expanded analysis for the home team entry |

**Cadence:** Weekly during the season.

---

### 2.8 Weekly Roundup (existing -- keep)

**Current state:** Engine generates 600-1000 word roundups.

**Template additions:**

| Element | Details |
|---------|---------|
| Match results grid | Visual grid of all RBNY matches that week |
| Stat of the week callout | One highlighted metric with context |
| Upcoming fixtures preview | Next 1-2 matches with date/time/opponent |
| Newsletter CTA | Inline signup prompt for the weekly newsletter |

**Cadence:** Every Monday morning.

---

### 2.9 Stat of the Week (existing -- keep)

**Current state:** Engine generates 300-500 word stat-of-the-week articles.

This format works well as-is. One addition:

| Element | Details |
|---------|---------|
| Social-first visual | Generate a single-image graphic optimized for Instagram/Twitter sharing |

**Cadence:** Midweek (Wednesday or Thursday), creating a content beat between match days.

---

### 2.10 Opinion / Editorial (new)

Independent editorial voice is what separates SWS from club media.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Hero image | Yes | Match photo or thematic image |
| Tag badge | Yes | "Editorial" (new tag, color: `#EC4899`) |
| Author byline | Yes | Even for AI-generated, credit "South Ward Signal Staff" |
| Clearly labeled as opinion | Yes | "OPINION" label above headline |
| Thesis in opening paragraph | Yes | State the argument upfront |
| Data-backed argument body | Yes | Every opinion supported by stats |
| Counterargument section | Recommended | Acknowledge the other side |
| Conclusion and call to action | Yes | What should change, what to watch for |

**Word count:** 600-1000
**Cadence:** 1-2 per month. Quality over quantity. Reserve for significant moments (coaching changes, roster decisions, front office moves).

---

### 2.11 Historical Retrospective (new)

Connects past and present. Strengthens supporter identity and institutional memory.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Archival hero image | Yes | Historical photo with date stamp overlay |
| Tag badge | Yes | "History" (new tag, color: `#A0A0AC`) |
| "On This Day" or anniversary hook | Recommended | Tie to a calendar date when possible |
| Narrative storytelling | Yes | Scene-setting, character-driven |
| Stats comparison (then vs. now) | Optional | Compare eras using available metrics |
| Photo gallery | Recommended | Ghost gallery card with 3-9 archival images |
| Community memory callout | Optional | "Were you there?" prompt for engagement |

**Word count:** 800-1500
**Cadence:** 1 per month during season; 2 per month during off-season (this is prime off-season content).

---

### 2.12 Supporter Culture Feature (new)

Covers the South Ward community itself: Empire Supporters Club, Viking Army, Garden State Ultras, tifo creation, chant origins, away day stories.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Photo hero (supporter-sourced when possible) | Yes | Tifo display, march to the match, South Ward atmosphere |
| Tag badge | Yes | "South Ward" (new tag, color: `#ED1A3D`) |
| Storytelling narrative | Yes | First-person accounts, group profiles, origin stories |
| Photo gallery | Recommended | Ghost gallery card |
| Audio embed | Optional | Chant recordings via Ghost audio card |
| Video embed | Optional | Tifo reveals, march footage |
| Community credit | Yes | Credit supporter groups and individuals by name |

**Word count:** 500-1200
**Cadence:** 1-2 per month. Source heavily from the community.

---

### 2.13 Podcast Show Notes (new)

If/when SWS launches a podcast, Ghost's audio card provides native embedding.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Episode cover art | Yes | Consistent branding, episode number |
| Ghost audio card | Yes | Embed the audio file directly (up to 1GB supported) |
| Episode summary | Yes | 2-3 paragraph overview |
| Timestamps / chapter markers | Yes | Clickable time codes for key segments |
| Guest bio | If applicable | Name, role, photo |
| Key quotes pullout | Recommended | 2-3 highlighted quotes from the episode |
| Related articles | Yes | Links to articles discussed in the episode |
| Subscribe links | Yes | Apple Podcasts, Spotify, RSS |

**Word count:** 300-500 (show notes are concise)
**Cadence:** Weekly during season, bi-weekly off-season.

---

### 2.14 Photo Gallery (new)

Match day photography and supporter culture documentation.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Gallery title | Yes | "Match Day in Photos: RBNY vs. [Opponent]" |
| Tag badge | Yes | "Photos" (new tag) |
| Ghost gallery card | Yes | Up to 9 images per card, multiple cards allowed |
| Minimal caption text | Yes | Short captions per image or per gallery block |
| Photographer credit | Yes | Credit all photographers |

**Cadence:** After every home match. Curated from supporter submissions and staff photography.

---

### 2.15 Infographic (new)

Standalone visual content optimized for sharing.

**Template structure:**

| Element | Required | Details |
|---------|----------|---------|
| Full-width infographic image | Yes | Designed in brand colors and fonts |
| Brief context paragraph | Yes | 2-3 sentences explaining the data story |
| Tag badge | Yes | "Infographic" (new tag) |
| CTA to data room | Yes | Link to explore the underlying data |
| Download option | Optional | Ghost file card for high-res download |

**Cadence:** 2 per month. Repurpose data room visualizations into shareable formats.

---

## 3. Editorial Calendar and Cadence

### 3.1 MLS 2026 Season Key Dates

| Phase | Dates | Content Focus |
|-------|-------|---------------|
| Preseason | Jan 15 - Feb 20 | Roster previews, preseason results, season predictions |
| Primary Transfer Window | Jan 26 - Mar 26 | Transfer intel, scouting reports, squad analysis |
| Regular Season Phase 1 | Feb 21 - May 24 | Full match-week cadence (see 3.2) |
| FIFA World Cup Break | May 25 - Jul 15 | Off-season content mode (see 3.3) |
| Regular Season Phase 2 | Jul 16 - Nov 7 | Return with rivalry matches, ramp to playoffs |
| Secondary Transfer Window | Jul 13 - Sep 2 | Transfer coverage alongside match coverage |
| Roster Freeze | Oct 9 | Final squad assessment |
| Playoffs | November - December | Playoff surge cadence (see 3.4) |
| MLS Cup | Dec 18 | Season finale coverage |
| Off-Season | Dec 19 - Jan 14 | Retrospectives, awards, community content |

### 3.2 Standard Match-Week Cadence

For weeks with a single match (most common):

| Day | Content | Type |
|-----|---------|------|
| Monday | Weekly Roundup | Weekly Roundup |
| Tuesday | Stat of the Week or Data Deep-Dive | Data |
| Wednesday | Tactical Analysis or Player Spotlight | Analysis |
| Thursday | Pre-Match Preview | Match Intelligence |
| Friday | Transfer Intel or Editorial (when warranted) | Varies |
| Saturday/Sunday | Match Day: Live social coverage, post-match recap | Match Intelligence |
| Saturday/Sunday | Match Day Photos gallery | Photos |

For mid-week matches (US Open Cup, CCL, double game weeks):

| Day | Content |
|-----|---------|
| Match Day -1 | Abbreviated preview (400-500 words) |
| Match Day | Live coverage and recap |
| Match Day +1 | Standard preview for weekend match |

**Target output:** 5-7 pieces per week during the active season.

### 3.3 World Cup Break Content (May 25 - Jul 15, 2026)

The 2026 FIFA World Cup pause is a 7-week window. This is a unique opportunity because the World Cup is being hosted in the US (including matches at MetLife Stadium, adjacent to Red Bull Arena).

| Week | Theme | Content Ideas |
|------|-------|---------------|
| 1 | Season review so far | "First Half Report Card" -- data-driven assessment of every player |
| 2 | World Cup preview | RBNY players in the World Cup, local angle on MetLife matches |
| 3 | Historical | "Red Bulls at the World Cup" -- every RBNY player who represented their country |
| 4 | Tactical deep-dive | Multi-match tactical analysis: "What we learned in the first 15 games" |
| 5 | Transfer window | Secondary window opens Jul 13 -- preview needs and targets |
| 6 | Community | Supporter culture features, South Ward oral history, tifo retrospectives |
| 7 | Return preview | "Second Half Preview" -- what needs to change, prediction for final stretch |

**Target output:** 3-4 pieces per week during the break.

### 3.4 Playoff Surge Cadence

During the playoffs, intensity increases:

| Content | Frequency |
|---------|-----------|
| Match previews | Every match (expanded, 800-1200 words) |
| Match recaps | Every match (expanded, 1000-1500 words) |
| Tactical deep-dives | After every round |
| Daily social content | 2-3 posts per day across platforms |
| Newsletter | Every match day (not just weekly) |

### 3.5 Off-Season Content (Dec 19 - Jan 14)

| Content Type | Details |
|--------------|---------|
| Season Awards | SWS awards: MVP, Golden Boot, Best Signing, Most Improved, Fan Favorite |
| Season in Review | Comprehensive statistical season review with data room |
| Historical retrospectives | 2 per week |
| Transfer Intel | Off-season moves, contract expirations, draft coverage |
| Supporter culture | Year-end tifo roundup, South Ward highlights reel |
| Community polls | "Your vote: Best match of 2026", "Best goal of 2026" |

---

## 4. Ghost CMS Strategy

### 4.1 Tags and Taxonomy

Ghost uses a flat tag system. Structure it with a combination of primary content-type tags and secondary topic tags.

**Primary Tags (content type -- one per post, used as `primary_tag`):**

| Tag Slug | Display Name | Color | Notes |
|----------|-------------|-------|-------|
| `match-recap` | Match Recap | `#ED1A3D` | Already exists |
| `preview` | Preview | `#3B82F6` | Already exists |
| `player-spotlight` | Player Spotlight | `#D4A843` | Already exists |
| `power-rankings` | Power Rankings | `#8B5CF6` | Already exists |
| `transfer-intel` | Transfer Intel | `#22C55E` | Already exists |
| `stat-of-week` | Stat of the Week | `#F59E0B` | Already exists |
| `weekly-roundup` | Weekly Roundup | `#EC4899` | Already exists |
| `tactical-analysis` | Tactical Analysis | `#8B5CF6` | New |
| `data-deep-dive` | Data Deep-Dive | `#F59E0B` | New |
| `editorial` | Editorial | `#EC4899` | New |
| `history` | History | `#A0A0AC` | New |
| `south-ward` | South Ward | `#ED1A3D` | New |
| `podcast` | Podcast | `#3B82F6` | New |
| `photos` | Photos | `#6E6E7A` | New |
| `infographic` | Infographic | `#F59E0B` | New |

**Secondary Tags (topic -- multiple per post):**

| Tag Slug | Purpose |
|----------|---------|
| `#rbny` | Internal tag (starts with #), all RBNY content |
| `#mls` | League-wide content |
| `#eastern-conference` | Conference-level content |
| `#transfer-window` | Transfer window period content |
| `#playoffs` | Playoff content |
| `#us-open-cup` | Cup competition content |
| `#academy` | Academy and homegrown content |
| `#world-cup-2026` | World Cup break content |
| Player name tags | e.g., `#emil-forsberg` for player-specific content |
| Opponent tags | e.g., `#nycfc`, `#philadelphia-union` for H2H content |

**Internal tags** (prefixed with `#`) are hidden from public display but available for filtering and newsletter segmentation.

### 4.2 Ghost Cards Usage by Content Type

Map Ghost's 20 editor card types to specific content use cases:

| Card | Use Case in SWS |
|------|-----------------|
| **Image** | Hero images, tactical diagrams, screenshots |
| **Gallery** | Match day photos (up to 9 per card), tifo galleries |
| **Video** | Match highlights (self-hosted), tactical analysis clips |
| **Audio** | Podcast episodes (up to 1GB), chant recordings |
| **Bookmark** | Link to data room pages, external source articles |
| **Callout** | Key stat callouts, breaking news alerts, injury updates |
| **Toggle** | Methodology notes in data deep-dives, FAQ sections, expanded lineups |
| **Button** | CTA to data room, newsletter signup, membership upgrade |
| **Divider** | Section breaks between article segments |
| **HTML** | Embedded data room visualizations (iframe or React components) |
| **Email content** | Newsletter-exclusive commentary, member-only insights |
| **Public preview** | Teaser for paid content (when membership tiers are active) |
| **Signup** | Inline newsletter/membership signup forms |
| **File** | Downloadable infographics, wallpapers, printable schedules |
| **Product** | Merchandise recommendations (future) |
| **Header** | Visual section headers within long-form pieces |
| **Embed** | YouTube highlights, Spotify podcast, Twitter/X embeds |
| **GIF** | Celebration moments, match reactions |
| **Markdown** | Footnotes, technical notation in data pieces |

### 4.3 Custom Excerpts and Metadata

Every post should include:

- **Custom excerpt:** 120-160 characters, written for search and social sharing. Never auto-generated.
- **SEO title:** Include target keyword. Format: "[Title] | South Ward Signal"
- **Meta description:** Distinct from excerpt, optimized for search intent (155-160 chars).
- **Open Graph image:** Custom or feature image, 1200x630px for social cards.
- **Canonical URL:** Set for syndicated content to avoid duplicate indexing.

### 4.4 Content Scheduling

Ghost supports scheduled publishing. Use it for:

- Pre-match previews: Schedule 24-36 hours before kickoff
- Weekly roundups: Schedule for Monday 7:00 AM ET
- Stat of the week: Schedule for Wednesday 12:00 PM ET
- Power rankings: Schedule for Tuesday 10:00 AM ET

Post-match recaps should be published immediately after review (not scheduled).

---

## 5. Newsletter Strategy

Ghost's built-in email system eliminates the need for external providers (Mailchimp, ConvertKit). The platform supports multiple newsletters from a single site, audience segmentation, and native analytics.

### 5.1 Newsletter Products

Launch with three distinct newsletters, each serving a different audience need:

**Newsletter 1: "The Signal" (Weekly Digest)**

| Attribute | Details |
|-----------|---------|
| Frequency | Every Monday, 7:00 AM ET |
| Audience | All subscribers (free and paid) |
| Content | Week in review, key stats, upcoming fixtures, top articles |
| Format | Curated summary with links to full articles |
| Goal | Drive traffic back to site, maintain weekly engagement |
| Subject line formula | "The Signal: [Key storyline from the week]" |

**Newsletter 2: "Match Day" (Pre-Match Alert)**

| Attribute | Details |
|-----------|---------|
| Frequency | 4-6 hours before every RBNY match |
| Audience | Opt-in segment (label: `match-day-alerts`) |
| Content | Predicted lineup, key matchup to watch, one stat callout, viewing info |
| Format | Short and punchy, 300-400 words max |
| Goal | Prime readers for the match, drive preview article reads |
| Subject line formula | "MATCH DAY: RBNY vs. [Opponent] -- [Key angle]" |

**Newsletter 3: "The Data Sheet" (Monthly Analytics Digest)**

| Attribute | Details |
|-----------|---------|
| Frequency | First Tuesday of each month |
| Audience | Data-interested segment (label: `data-enthusiasts`) |
| Content | Top data room highlights, new visualizations, monthly xG trends, one featured deep-dive |
| Format | Visual-heavy, chart screenshots with commentary |
| Goal | Showcase data room as a differentiator, convert casual readers to power users |
| Subject line formula | "The Data Sheet: [Month] -- [Lead insight]" |

### 5.2 Segmentation Strategy

Use Ghost's member labels and filters to segment the audience:

| Segment | Label | Criteria | Content |
|---------|-------|----------|---------|
| All Subscribers | (default) | Everyone | The Signal weekly digest |
| Match Day Alerts | `match-day-alerts` | Self-selected opt-in | Pre-match alerts |
| Data Enthusiasts | `data-enthusiasts` | Self-selected or engaged with data room | The Data Sheet |
| Founding Members | `founding-member` | Signed up before season opener | Exclusive previews, early access |
| Away Day Crew | `away-day` | Self-selected | Away match logistics, travel info |

### 5.3 Ghost Email Content Card Usage

Use the **Email content** card to include subscriber-only commentary within posts that are otherwise public. This creates a "bonus" incentive for newsletter readers:

- Public article: Full match recap visible to all
- Email version: Same article plus a "Newsletter Exclusive" callout with extended tactical notes or a hot take not published on-site

### 5.4 Growth Tactics

| Tactic | Implementation |
|--------|---------------|
| Signup card in every article | Ghost signup card embedded at article end |
| Data room gate | Soft prompt: "Get weekly insights from the data room delivered to your inbox" |
| Social bio links | Newsletter signup as primary link in all social bios |
| Match day popup | Timed popup on site during match week (tasteful, dismissible) |
| Referral program | Ghost does not natively support referrals; consider Sparkloop integration |
| Welcome email | Automated welcome email for new free members with data room tour |

---

## 6. Community and Engagement Features

### 6.1 Player Ratings System

After every match, enable fans to submit player ratings.

**Implementation approach:**

| Component | Details |
|-----------|---------|
| Rating scale | 1-10 for each player who played |
| Submission window | Opens at final whistle, closes 24 hours later |
| Display | Average community rating shown on match recap page and player profile pages |
| Data storage | Supabase table: `community_ratings` (match_id, player_name, rating, user_id, timestamp) |
| Anti-manipulation | One rating per member per match (requires Ghost member login or email verification) |
| Visualization | Bar chart comparing community ratings to data-derived ratings |

### 6.2 Predictions and Polls

| Feature | Details |
|---------|---------|
| Match predictions | Score prediction before each match, tracked for accuracy leaderboard |
| Weekly poll | Single question (e.g., "Who should start at striker?", "Grade the transfer window: A-F") |
| Season-long prediction league | Points for correct scoreline, result, and goal scorers |
| Implementation | Custom Next.js components with Supabase backend, or third-party embed (Typeform, Straw Poll) for MVP |

### 6.3 Fan-Submitted Content

| Submission Type | Process |
|-----------------|---------|
| Match day photos | Submission form or email, curated by staff into photo galleries |
| Away day reports | Template-guided submissions (500-800 words), published with "Community" tag |
| Tifo concepts | Open submissions before designated tifo matches |
| Chant proposals | Audio or text submissions for new South Ward chants |

Credit every contributor by name. This builds loyalty and ownership.

### 6.4 Commenting System

Ghost does not have native commenting. Evaluate these options:

| System | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Hyvor Talk** | No ads, no tracking, modern UI, real-time updates, reactions, voting | No free plan ($12/mo starter), smaller community | Best option for quality and privacy |
| **Disqus** | Free tier, large existing user base, mature feature set | Ads on free plan, heavy tracking, data harvesting, slow loading | Avoid -- brand and privacy misalignment |
| **Giscus** | Free, GitHub-backed, clean | Requires GitHub account -- limits non-technical fans | Not suitable for this audience |
| **Custom build** | Full control, integrated with Ghost members | Development time, moderation tooling needed | Phase 2 consideration |

**Recommendation:** Start with **Hyvor Talk** on match recap and editorial pages only (highest-engagement content types). Expand to other content types based on engagement data.

### 6.5 Live Match Threads

For match days, provide a structured live experience:

| Component | Details |
|-----------|---------|
| Live blog format | Ghost does not support live updates natively; build as a custom Next.js page at `/live/[match-id]` |
| Content | Minute-by-minute commentary, stats updates, goal alerts |
| Community layer | Integrated comment thread or Discord embed |
| Post-match transition | Live page becomes the match recap once the final article is published |

**MVP approach:** Embed a Discord channel widget for the match thread, with staff providing commentary. Long-term, build a custom live page.

---

## 7. Social Media Distribution

### 7.1 Platform Strategy

The existing codebase already defines social handles and generates platform-specific content:

- `@SouthWardSignal` on Twitter/X
- `@southwardsignal` on Instagram
- `@southwardsignal` on TikTok
- `@southwardsignal.bsky.social` on Bluesky

**Platform roles:**

| Platform | Role | Content Format | Posting Frequency |
|----------|------|---------------|-------------------|
| **Twitter/X** | Real-time commentary, match reactions, stat drops, thread analysis | Text-first, stat graphics, threads | 3-5 posts/day during season |
| **Instagram** | Visual storytelling, match photos, infographics, Reels | Carousel posts, Stories, Reels | 1-2 posts/day, 3-5 Stories on match days |
| **TikTok** | Short-form video, tactical explainers, stat reveals, match reactions | 15-60 second vertical video, trending audio | 3-4 videos/week |
| **Bluesky** | Community conversation, alt-Twitter audience, longer-form takes | Text posts, quote threads | 2-3 posts/day |

### 7.2 Content Flow: Site to Social

The content engine already generates social content for each article type (Twitter threads, TikTok captions, Instagram captions, Bluesky posts). The flow should be:

```
Article published on Ghost
    |
    v
Social queue populated (Supabase social_queue table)
    |
    +---> Twitter/X: Thread posted (tweet 1 immediately, rest threaded)
    +---> Instagram: Carousel or single image posted
    +---> TikTok: Video or carousel posted (manual or via API)
    +---> Bluesky: Thread posted
    |
    v
Social engagement tracked (likes, shares, replies)
    |
    v
Performance data feeds back to content prioritization
```

### 7.3 Social-First Content (Not Derived from Articles)

Some content should originate on social, not on the site:

| Content Type | Platform | Description |
|--------------|----------|-------------|
| Stat drops | Twitter/X, Instagram | Single-stat graphic (e.g., "RBNY xG differential this season: +4.2") |
| Formation graphics | Twitter/X, Instagram | Pre-match predicted lineup visual |
| Match day countdown | Instagram Stories | "3 hours until kickoff" with fixture info |
| Post-match poll | Twitter/X | "MOTM: Vote" with player options |
| Tactical clips | TikTok, Reels | 30-second clip explaining one tactical concept |
| "On This Day" | All platforms | Historical moment with archive photo |
| Data room teasers | All platforms | Screenshot of a visualization with "Explore the full data room at southwardsignal.com" |

### 7.4 Social Embeds in Articles

Use Ghost's embed card to bring social proof into articles:

- Embed relevant tweets (verified reporter quotes, official club announcements) in transfer intel
- Embed TikTok videos in supporter culture pieces
- Embed Instagram posts for photo galleries and community content
- Embed YouTube for match highlights and press conference clips

### 7.5 Automation Approach

The existing `social-scheduler` automation script provides the foundation. Extend it with:

| Capability | Details |
|------------|---------|
| Auto-post on publish | When Ghost publishes an article, trigger social queue processing |
| Platform-specific formatting | Different image crops, text lengths, and hashtag strategies per platform |
| Scheduling | Space posts across the day rather than all at once |
| Engagement monitoring | Track which content types drive the most traffic back to the site |
| Cross-promotion | Every social post links back to the full article or data room |

---

## 8. Content Taxonomy and Organization

### 8.1 URL Structure

| Content | URL Pattern |
|---------|-------------|
| Articles | `/articles/[slug]` (existing) |
| Articles by tag | `/articles/tag/[tag-slug]` (add) |
| Data room | `/data-room` (existing) |
| Data room sub-pages | `/data-room/[section]` (existing) |
| Live match | `/live/[match-id]` (future) |
| Newsletter archive | `/newsletter` (Ghost handles this natively) |

### 8.2 Content Hierarchy on the Site

**Primary navigation:**

| Link | Target |
|------|--------|
| Home | `/` |
| Articles | `/articles` -- filterable by tag |
| Data Room | `/data-room` |
| Newsletter | `/newsletter` or Ghost subscribe page |
| About | `/about` |

**Sub-navigation within Articles:**

Tag-based filtering. Display tag pills at the top of the articles page:
Match Recap | Preview | Tactical Analysis | Player Spotlight | Transfer Intel | Data Deep-Dive | Editorial | South Ward | All

### 8.3 Content Relationships

Use Ghost's tag system and the Next.js frontend to create content connections:

| Relationship | How to Build |
|--------------|-------------|
| Match recap links to its preview | Tag both with opponent tag + match week tag, query by overlap |
| Player spotlight links to their data room profile | Internal link in article body + sidebar widget |
| Transfer intel links to related player spotlight | Shared player name tag |
| Data deep-dive links to data room section | Ghost bookmark card pointing to data room URL |
| Weekly roundup links to all week's articles | Auto-generated from articles published in that date range |

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Immediate -- This Month)

| Task | Priority |
|------|----------|
| Add new tag definitions to Ghost (tactical-analysis, data-deep-dive, editorial, history, south-ward, podcast, photos, infographic) | High |
| Update `ARTICLE_TAGS` and `TAG_COLORS` in `packages/shared/src/constants.ts` to include new content types | High |
| Update `ArticleType` union type in `packages/shared/src/types.ts` to include new types | High |
| Add tag filtering UI to the `/articles` page | High |
| Create the "The Signal" weekly newsletter template in Ghost | High |
| Set up Ghost member labels for segmentation (match-day-alerts, data-enthusiasts) | Medium |
| Add word count targets for new content types to `WORD_COUNT_TARGETS` | Medium |

### Phase 2: Content Expansion (Month 2)

| Task | Priority |
|------|----------|
| Build engine templates for new content types (tactical-analysis, data-deep-dive, editorial) | High |
| Create "Match Day" newsletter template and automation | High |
| Integrate Hyvor Talk commenting on match recap pages | Medium |
| Build match prediction submission component (Supabase-backed) | Medium |
| Build player rating submission component (Supabase-backed) | Medium |
| Create social-first content templates (stat drop graphics, formation graphics) | Medium |

### Phase 3: Community (Month 3)

| Task | Priority |
|------|----------|
| Launch "The Data Sheet" monthly newsletter | Medium |
| Build prediction leaderboard page | Medium |
| Implement fan-submitted content pipeline (photo submissions, away day reports) | Medium |
| Create photo gallery template and workflow | Medium |
| Evaluate podcast launch readiness | Low |

### Phase 4: Scale (Month 4+)

| Task | Priority |
|------|----------|
| Live match thread page (`/live/[match-id]`) | Medium |
| Ghost membership tiers (free vs. paid) with content gating | Low |
| Podcast infrastructure (hosting, RSS, Ghost audio embeds) | Low |
| Automated social scheduling with engagement tracking | Medium |
| Content performance dashboard (internal analytics) | Low |

---

## Appendix A: Content Type Quick Reference

| Content Type | Tag | Word Count | Cadence | Engine Template |
|-------------|-----|-----------|---------|-----------------|
| Match Recap | match-recap | 800-1200 | Every match | Exists |
| Pre-Match Preview | preview | 600-900 | Every match | Exists |
| Player Spotlight | player-spotlight | 500-800 | 1/week | Exists |
| Power Rankings | power-rankings | 400-600 | 1/week | Exists |
| Transfer Intel | transfer-intel | 500-800 | As needed | Exists |
| Stat of the Week | stat-of-week | 300-500 | 1/week | Exists |
| Weekly Roundup | weekly-roundup | 600-1000 | 1/week | Exists |
| Tactical Analysis | tactical-analysis | 1200-2000 | 1/week | Build |
| Data Deep-Dive | data-deep-dive | 800-1500 | 2/month | Build |
| Editorial | editorial | 600-1000 | 1-2/month | Build |
| Historical | history | 800-1500 | 1-2/month | Build |
| Supporter Culture | south-ward | 500-1200 | 1-2/month | Manual |
| Podcast Notes | podcast | 300-500 | 1/week | Manual |
| Photo Gallery | photos | 100-200 | Every home match | Manual |
| Infographic | infographic | 100-200 | 2/month | Manual |

## Appendix B: Ghost Card Cheat Sheet for Writers

| When You Need To... | Use This Card |
|---------------------|---------------|
| Add a match photo | Image card |
| Show a set of match day photos | Gallery card (up to 9 images) |
| Embed a data room chart | HTML card (iframe embed) |
| Link to the data room or external source | Bookmark card |
| Highlight a key statistic | Callout card with custom color |
| Add a podcast episode | Audio card |
| Embed match highlights | Video card or Embed card (YouTube) |
| Hide methodology details | Toggle card |
| Prompt newsletter signup | Signup card |
| Add newsletter-exclusive commentary | Email content card |
| Gate content for paid members | Public preview card |
| Add a call to action | Button card or CTA card |
| Provide a downloadable file | File card |
| Separate article sections | Divider card |
| Embed a tweet or social post | Embed card |
| Add a reaction GIF | GIF card |

## Appendix C: Banned Phrases (Existing)

Already defined in `packages/shared/src/constants.ts`:

- "clinical finish"
- "they wanted it more"
- "gave 110%"
- "at the end of the day"
- "game of two halves"
- "park the bus"
- "world class"
- "the beautiful game"
- "footballing masterclass"

**Additions for new content types:**

- "a must-win game" (every game gets called this)
- "statement win" (overused in MLS media)
- "proved the doubters wrong"
- "showed their class"
- "a game of fine margins"
- "in the final third"
- "put in a shift"
- "the gaffer"
- "take it one game at a time"
- "deserved nothing less"

---

*This strategy document should be treated as a living document. Review and update quarterly, with a full revision at the end of the 2026 MLS season.*
