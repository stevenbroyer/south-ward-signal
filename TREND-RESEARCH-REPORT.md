# South Ward Signal: Sports Media Landscape Research Report
## Market Intelligence for an Independent Supporter-Run Analytics & Media Platform
### Prepared: March 11, 2026

---

## Executive Summary

South Ward Signal sits at a rare intersection: organized supporter culture, data analytics, and independent media. The research across 50+ sources reveals that this combination is genuinely underserved in American soccer. The 2026 FIFA World Cup is driving a 400% increase in first-time US soccer fans, MLS fan satisfaction with independent media rates 3.8/5 (significantly higher than mainstream coverage), and FiveThirtyEight's March 2025 shutdown left a void in accessible, fan-facing prediction and data journalism for soccer. Meanwhile, supporter groups across MLS have virtually no analytics-driven digital platforms. South Ward Signal can own this category.

The platform already has strong technical foundations: server-rendered data room with xG race charts, points trajectory, form streaks, match scoreboards, player stats tables, and top performers -- all pulling from Supabase with Ghost CMS for editorial content. The recommendations below are designed to build on what exists and push into the gaps the market is leaving wide open.

---

## 1. Sports Media Site Trends (2025-2026)

### What Best-in-Class Sites Are Doing

**The Athletic** (now 6M+ subscribers under NYT)
- 80+ exclusive podcasts, 10+ newsletter verticals, embedded video highlights via NBA/WNBA partnerships
- Hit profitability in 2025 under NYT ownership
- Flagship newsletter "The Pulse" drives daily engagement; newsletter subscribers grew 67% YoY to 5M
- Key pattern: **editorial depth + personalized delivery channels** (newsletters, app notifications, podcasts)

**FotMob** (20M+ users)
- 400+ competitions, real-time xG and shot maps, player ratings (0-10 scale based on 300+ individual stats per match)
- Rolling averages, percentile graphs, player comparison dashboards
- Home screen widgets, personalized alerts, TV schedules
- Key pattern: **data density made mobile-first and instant**

**American Soccer Analysis** (MLS analytics pioneer)
- Interactive tables, Viz Hub with 20+ visualization types (shot charts, pass charts, radars, sonar charts, heatmaps, passing clusters, defensive charts)
- Year selection spanning 2013-2026, zone/location filters, download/export capability
- $5/month Patreon for advanced tools; consulting arm separate from media
- Key pattern: **open data tools + Patreon monetization + consulting revenue**

**FiveThirtyEight** (shut down March 2025)
- Walt Disney Company closed the site and laid off ~15 employees
- Nate Silver left in 2023, took forecasting model rights to Silver Bulletin
- Soccer Power Index (SPI) and interactive club predictions were widely referenced
- Key pattern: **massive gap left in accessible prediction modeling for soccer fans**

**StatsBomb / Hudl StatsBomb**
- 3,400+ events per match, 190+ competitions, player-location data
- Player radars, shot maps, defensive activity maps, xG trendlines, corner maps, player comparisons
- Key pattern: **professional-grade visualization that sets the design standard**

**Tifo Football** (now under The Athletic)
- 1.7M YouTube subscribers, 155K monthly views
- Animated tactical explainers that translate complex analytics into accessible storytelling
- Key pattern: **illustration and animation as the bridge between analytics and casual fans**

**OneFootball** (200M+ monthly users)
- Partnered with MLS NEXT Pro for free global streaming in 2026
- Breaking news, highlights, live streaming in a single platform
- Key pattern: **aggregation + streaming + zero friction**

### Design Patterns Defining Best-in-Class

| Pattern | Examples | Relevance to SWS |
|---------|----------|-------------------|
| Dark mode as default | FotMob, StatsBomb IQ, most analytics platforms | Already implemented |
| Mono-spaced type for data, display type for editorial | StatsBomb, The Athletic | Already implemented |
| Card-based metric dashboards | FotMob, ASA Viz Hub, WhoScored | Already implemented |
| Scroll-reveal animations | Modern sports sites broadly | Already implemented |
| Interactive chart filtering (date ranges, positions, zones) | ASA Viz Hub, StatsBomb IQ | Partially implemented |
| Player comparison tools | FotMob, WhoScored, ASA | Link exists but page not built |
| Neon/glow accent effects on dark backgrounds | Industry trend 2025-2026 | Natural fit for SWS red accent |
| Video embeds alongside data storytelling | The Athletic, Tifo | Not yet implemented |

### Recommendation for SWS
The data room already mirrors many best-in-class patterns (dark mode, card metrics, xG charts, form streaks). The immediate gap is **interactivity** -- ASA's Viz Hub lets users explore data on their own terms. Adding client-side filtering, comparison tools, and downloadable visualizations would elevate SWS from "dashboard" to "tool."

---

## 2. Supporter Group Digital Presence

### Current State of MLS Supporter Groups Online

The South Ward ecosystem includes three main groups -- Empire Supporters Club, Viking Army, and Torcida 96 -- each with basic websites and social media accounts. This mirrors the broader MLS landscape where supporter groups maintain:

- **Basic websites**: Event calendars, membership signups, about pages, tifo galleries
- **Social media**: Twitter/X, Instagram, Facebook for match-day coordination
- **Coordination platforms**: GroupMe, WhatsApp, Discord for internal logistics
- **Content output**: Chants, tifo photos, away-day recaps -- almost entirely ephemeral social content

### What European Groups Do Differently

European ultras groups (Torcida Split, Bad Blue Boys, St. Pauli ultras) have built **brand identity** that transcends the match. St. Pauli's ultras became a global left-wing cultural brand. But even European ultras groups have minimal sophisticated digital presence -- their power is physical, visual, and cultural, not analytical or editorial.

### What's Missing Everywhere

No MLS supporter group operates anything resembling a **data-driven media platform**. The gap:

| What Exists | What Doesn't |
|-------------|--------------|
| Fan podcasts (Seeing Red, 1,000,000+ plays over 15 years) | Analytics dashboards run by supporters |
| SB Nation blogs (Once A Metro) | xG and advanced metrics presented for fans by fans |
| Social media accounts | Original data journalism from the terraces |
| Membership/merch sales | Community-driven player ratings and match analysis |
| Match-day coordination | Prediction models and forecasting |
| Photo/video galleries | Data visualization tools accessible to non-analysts |

### Recommendation for SWS
South Ward Signal is building something that **does not exist** in the MLS supporter ecosystem. This is the positioning: not just another fan blog or podcast, but the first supporter-run analytics and media operation in American soccer. Lean into this uniqueness in all messaging. The tagline should communicate "supporter intelligence" -- the view from the terraces backed by the rigor of a data room.

---

## 3. Fan Engagement Features

### What's Driving Engagement in 2025-2026

The Stats Perform 2026 Fan Engagement survey and SportsFirst research identify these as the highest-performing interactive features:

**Tier 1: Proven High-Impact**
- **Live polls**: Lowest friction, highest participation. "Man of the Match" polls during/after games generate 5-10x typical engagement
- **Predictions**: Create anticipation, competition, and repeat visits. Match result predictions are the entry point; xG predictions are the advanced tier
- **Player ratings**: FotMob and WhoScored built empires on this. Fan-submitted ratings vs. algorithmic ratings create natural debate
- **Leaderboards**: Prediction accuracy leaderboards make the platform feel competitive and social

**Tier 2: Growing Adoption**
- **Live match threads**: Reddit's r/soccer (7.3M members) proves demand. Discord serves this for real-time, but web-based threads have archive value
- **Rewards/points systems**: "Rewards wallets" add continuity across matches; gamification turns passive readers into active participants
- **Trivia and quizzes**: Low-effort to produce, high engagement during dead periods (international breaks, off-season)

**Tier 3: Emerging / Aspirational**
- **Tactical boards**: Fan-drawn formations and tactical analysis tools
- **Fantasy integrations**: Connecting player data to fantasy performance
- **Community forums**: Owned discussion space (vs. Reddit or Discord dependency)

### Generational Preferences (WSC Sports 2025-2026 Study)

| Feature | Gen Z | Millennials | Gen X |
|---------|-------|-------------|-------|
| Short-form clips (under 2 min) | 71% prefer | 39% prefer | Baseline |
| Athlete-driven loyalty | Primary | Secondary | Team-first |
| Personalized notifications | Expected | Expected | Nice-to-have |
| Streaming as primary platform | 55% | 65% | Lower |
| Daily sports consumption | Varies | 50% watch daily | Varies |
| Content discovery via short-form video | 62% discovered new team/player via short-form | Less | Less |

### Recommendation for SWS
Start with what's lowest-friction and highest-impact:

1. **Post-match polls** (Man of the Match, match rating 1-10) -- can be added to match detail pages immediately
2. **Match predictions** before each game (score, result, xG range) -- natural fit for the data room
3. **Season-long prediction leaderboard** -- creates repeat engagement and community identity
4. **Player rating comparison** -- "The fans say 7.2, the data says 6.8" creates content and debate

These don't require complex infrastructure. A simple form submission to Supabase with aggregation queries would work for v1.

---

## 4. Data Visualization in Sports

### State of the Art (Fan-Facing)

The gap between professional analytics tools (StatsBomb IQ, used by Premier League clubs) and fan-facing data presentation is closing but remains wide:

**What Works (Accessible)**
- **Shot maps with xG overlay**: Simple, visual, immediately communicates chance quality. FotMob and Understat do this well
- **Player radars / pizza charts**: Popularized by StatsBomb, now expected by analytics-literate fans. Shows multi-dimensional performance at a glance
- **Rolling form indicators**: Win/Draw/Loss pills with color coding. SWS already has this
- **xG timeline / race charts**: Show how a match unfolded beyond the scoreline. SWS already has this
- **Percentile bars**: "This player is in the 87th percentile for progressive passes" -- simple, no chart literacy needed
- **Comparison side-by-side**: Two players, same metrics, visual bar comparison

**What Overwhelms (Too Complex for General Fans)**
- **Passing networks**: Valuable but need heavy annotation to be interpretable
- **Pitch control models**: Gorgeous but abstract without context
- **Voronoi diagrams**: Academic feel, limited fan appeal
- **Raw data tables without visual hierarchy**: Numbers without story

**The Premier League + Microsoft Partnership (2025)**
- Five-year AI-driven analytics deal
- Fan-facing tactical dashboards expected to be standard by 2030
- Sets the trajectory: data visualization for fans is becoming an expectation, not a luxury

**ASA Viz Hub as Template**
The American Soccer Analysis Viz Hub offers the closest template for what SWS could build:
- 20+ chart types organized by Player / Team / League tabs
- Temporal controls (year, date range, game-by-game)
- Dropdown search for players and teams
- Zone and position filters
- Image export / download
- Built with Shiny (R), but the UX patterns transfer to React

### Recommendation for SWS
The data room already has strong foundations (MetricCard, XgRaceChart, PointsTrajectoryChart, FormStreak, MatchScoreboard, StandingsTable, PlayerStatsTable). To reach best-in-class:

1. **Add shot maps with xG bubbles** to individual match pages -- this is the single most impactful missing visualization
2. **Build player radar/pizza charts** on player detail pages -- the data is in Supabase, the visualization is the gap
3. **Add percentile context** to player stats -- "87th percentile in MLS" transforms a number into a story
4. **Enable chart export/download** -- fans share visualizations on social media, which drives organic growth
5. **Progressive disclosure** -- show the headline number first, let curious users drill into the methodology

---

## 5. Content Format Trends

### What Fans Are Consuming in 2025-2026

**Short-Form Video (Dominant Discovery Channel)**
- 60%+ of social media users watch Reels/Shorts/TikTok for sports updates
- Sports organizations now monetize short-form content as core product, not just marketing
- 62% of fans discovered a new team, player, or league through short-form video
- Short-form is now a *revenue driver*, not just engagement bait

**Newsletters (Highest-Loyalty Channel)**
- The Athletic grew newsletter subscribers to 5M (67% YoY growth)
- Substack sports newsletters are booming: "Your Knicks" hit 1K subscribers in 3 months
- Localized, team-specific newsletters have the highest open and retention rates
- One creator notes: "Substack has been excellent for catering to a small but passionate fan base"

**Podcasts (Video-First Evolution)**
- Podcasting is now a video-first medium -- YouTube is the world's most popular podcast platform
- Netflix signed podcast deals with Barstool Sports and The Ringer
- "Seeing Red" (RBNY) has 1M+ plays across 15 years, proving demand exists for this audience
- Best practice: one recording becomes podcast episode + YouTube video + newsletter article + social clips

**Long-Form Analysis (Niche but High-Value)**
- Content overload is real: 53% of Millennials feel overwhelmed by sports content volume
- Long-form differentiates: it signals expertise and depth, filtering for engaged readers
- IMG 2026 report calls out "the short-form fallacy" -- both formats are needed, not one or the other

**Match-Day Experiences (Multi-Platform)**
- Live commentary, real-time stats, and social interaction during matches
- Second-screen behavior is standard: fans want stats alongside the broadcast
- Competition for match-day attention will intensify during 2026 World Cup

### Recommendation for SWS
The editorial infrastructure (Ghost CMS) already supports long-form. The immediate content format priorities:

1. **Weekly newsletter** via Ghost's built-in email system -- match recap + data insight + prediction for next match. This is the highest-ROI content investment
2. **Social-ready chart exports** from the data room -- every visualization should be shareable with SWS branding (logo watermark, URL)
3. **Match-day data threads** -- real-time xG updates, shot maps, and key stats published during/immediately after matches
4. **One podcast recording = four outputs** -- if a podcast ever launches, plan for audio + video + newsletter recap + social clips from day one
5. **Short-form data clips** -- 15-30 second animated stat reveals (xG comparison, player highlight) for Instagram/TikTok. The Python viz pipeline already generates charts; animating them is the next step

---

## 6. Monetization and Sustainability

### How Independent Sports Media Sustains Itself

**Model 1: Membership / Subscription**
- The Athletic: $6M+ subscribers, now profitable under NYT
- Patreon: 250K+ active creators, $10B+ cumulative payouts, 8M monthly paying patrons
- ASA charges $5/month on Patreon for advanced visualization tools
- Substack: Creator-friendly revenue split, growing sports vertical

**Model 2: Advertising / Sponsorship**
- The Athletic raising ad prices as newsletter subscribers scale
- Local/regional sponsorships for independent media (breweries, gear shops, sports bars)
- Sports betting sponsorship is massive but ethically complex for supporter groups

**Model 3: Merchandise**
- ASA sells tees, outerwear, and branded items through Squarespace commerce
- Supporter groups already have merch infrastructure (scarves, stickers, pins)
- Data-themed merch is a niche but real category (xG t-shirts, radar chart prints)

**Model 4: Consulting / Services**
- ASA runs a consulting arm separate from media, advising MLS clubs on player recruitment
- Mint City Analytics' creator parlayed his blog into a Data Analyst role at Charlotte FC
- Data skills demonstrated publicly become professional credibility

**Model 5: Community Events**
- Paid watch parties, analysis sessions, season preview events
- Supporter groups already run tailgates and events; adding an analytical component differentiates

### Revenue Projections for an Independent Soccer Analytics Platform

| Model | Year 1 Potential | Scalability | Effort |
|-------|-----------------|-------------|--------|
| Patreon / Membership ($5-10/mo) | $6K-24K (100-200 members) | Moderate | Low |
| Newsletter sponsorship | $2K-8K | High with subscriber growth | Low |
| Merch (data-themed + supporter) | $3K-10K | Moderate | Medium |
| Local event sponsorship | $2K-5K | Low | Medium |
| Consulting (player analysis) | $5K-20K | High | High |

### Recommendation for SWS
The most sustainable path combines **free core content** (data room, articles, newsletter) with **premium perks** (advanced viz tools, early access, exclusive analysis, downloadable data exports):

1. **Launch a Patreon or Ghost membership tier** -- $5/month for advanced data room features (player comparison tool, downloadable charts, early access to analysis)
2. **Weekly newsletter as the free acquisition channel** -- this builds the audience that converts to membership
3. **Data-themed merch** -- xG differential graphics on t-shirts, radar chart prints, supporter-analytics crossover designs
4. **Avoid betting sponsorships** -- they conflict with supporter group values and erode trust
5. **Long-term: consulting positioning** -- demonstrating analytical capability publicly builds the case for paid consulting work with clubs, agencies, or media outlets

---

## 7. Emerging Opportunities

### The Gaps South Ward Signal Can Own

**Gap 1: The FiveThirtyEight Void**
FiveThirtyEight shut down in March 2025. Its Soccer Power Index and club prediction models were widely used and referenced. No successor has filled this space for MLS-focused, fan-facing prediction modeling. SWS already has xG data and match data in Supabase -- building a simple match prediction model and publishing weekly forecasts would immediately fill a recognized gap.

**Gap 2: Supporter-Run Analytics (Category of One)**
No MLS supporter group operates a data analytics platform. Not one. The closest analogs are:
- American Soccer Analysis (independent media, not supporter-affiliated)
- Once A Metro / MetroFanatic (fan blogs, no analytics depth)
- Seeing Red podcast (audio-only, no data infrastructure)
SWS would be the first. This is not an incremental improvement -- it's a new category.

**Gap 3: The 2026 World Cup Amplifier**
US soccer fandom is growing 400% YoY among first-time fans. The World Cup will bring millions of new viewers who want to understand the game. A platform that explains soccer through data -- accessibly -- will capture attention that persists after the tournament. MLS will be the beneficiary league, and RBNY will have a new generation of potential fans in the NY metro area.

**Gap 4: MLS Coverage Gap in New York**
Red Bulls are the "11th or 12th professional team" in the New York market. Mainstream media barely covers them. Independent outlets like Seeing Red, Once A Metro, and MetroFanatic fill the editorial void, but none offer analytics depth. Fans rate independent media satisfaction at 3.8/5 and describe these outlets as "the lifeblood of their fandom." Adding data to that lifeblood raises the ceiling.

**Gap 5: Localized Data Storytelling**
Global platforms (FotMob, WhoScored) present data without narrative. The Athletic has narrative without supporter perspective. ASA has analytics without team-specific depth. Nobody is doing **localized data storytelling** -- taking the numbers and telling the South Ward's story through them. "Our pressing intensity dropped 15% in the second half" hits different when it comes from the section behind the goal.

**Gap 6: Community-Driven Player Intelligence**
Fan ratings + algorithmic ratings + tactical context = something no platform offers for MLS at the team level. When a supporter group can say "we rated him 4.2, the data says 5.1, here's why the gap matters," that's original content that no beat writer or global platform produces.

**Gap 7: Cross-Platform Content Factory**
The architecture to turn one data insight into five content pieces (newsletter paragraph, social graphic, data room update, podcast talking point, match thread annotation) is a competitive moat. Most independent outlets produce in one format. SWS can produce in all of them because the data infrastructure generates the raw material.

---

## Strategic Recommendations: Priority Roadmap

### Phase 1: Immediate (Next 30 Days)

| Action | Impact | Effort |
|--------|--------|--------|
| Add post-match polls (MOTM, match rating) to match detail pages | High engagement, community signal | Low |
| Enable chart export with SWS branding on all data room visualizations | Organic social growth | Medium |
| Launch weekly Ghost newsletter (match recap + data insight + prediction) | Highest-ROI content channel | Low |
| Add shot map visualization to individual match pages | Most requested missing viz | Medium |

### Phase 2: Near-Term (60-90 Days)

| Action | Impact | Effort |
|--------|--------|--------|
| Build player comparison tool (the link already exists at /players/compare) | Core data room feature | Medium |
| Add player radar/pizza charts to player detail pages | Visual differentiation | Medium |
| Create match prediction model (simple xG-based) with weekly published forecasts | Fills FiveThirtyEight void | Medium |
| Launch prediction leaderboard for community members | Repeat engagement driver | Medium |
| Launch Patreon / Ghost membership tier ($5/month for advanced features) | Revenue foundation | Low |

### Phase 3: Growth (90-180 Days)

| Action | Impact | Effort |
|--------|--------|--------|
| Build "World Cup mode" content for summer 2026 -- xG explainers, data literacy series | Capture new-fan wave | High |
| Add percentile context to all player stats ("87th in MLS") | Data accessibility | Medium |
| Create shareable social graphics pipeline (automated from data room) | Scale organic reach | High |
| Develop season preview / midseason report as flagship content pieces | Authority positioning | High |
| Explore data-themed merch line | Revenue diversification | Medium |

### Phase 4: Long-Term (6-12 Months)

| Action | Impact | Effort |
|--------|--------|--------|
| Community forum or structured discussion space (owned, not Reddit/Discord) | Platform stickiness | High |
| Video content: animated data explainers in Tifo style | Audience expansion | High |
| Consulting positioning: publish methodology, build credibility | Revenue ceiling removal | Medium |
| API access for other supporter groups / fan developers | Ecosystem play | High |

---

## Competitive Positioning Matrix

| Platform | Editorial | Analytics | Supporter Voice | Community | Visual Design |
|----------|-----------|-----------|-----------------|-----------|---------------|
| The Athletic | 10/10 | 5/10 | 2/10 | 3/10 | 8/10 |
| FotMob | 4/10 | 8/10 | 1/10 | 2/10 | 9/10 |
| ASA | 7/10 | 10/10 | 2/10 | 3/10 | 6/10 |
| Once A Metro | 6/10 | 2/10 | 7/10 | 5/10 | 4/10 |
| Seeing Red | 7/10 | 3/10 | 9/10 | 7/10 | 3/10 |
| **SWS Target** | **7/10** | **8/10** | **9/10** | **8/10** | **9/10** |

South Ward Signal's differentiation is the combination: no one else scores above 5 in both Analytics AND Supporter Voice. That intersection is the moat.

---

## Key Statistics Summary

- **6M+** The Athletic subscribers (May 2025)
- **20M+** FotMob users globally
- **7.3M** r/soccer Reddit members
- **400%** YoY growth in first-time US soccer fans
- **3.8/5** MLS fan satisfaction with independent media (vs. lower for mainstream)
- **62%** of fans discovered a new team/player via short-form video
- **67%** YoY growth in newsletter subscribers at The Athletic
- **$10B+** cumulative Patreon payouts to creators
- **53%** of Millennials feel overwhelmed by sports content volume
- **0** MLS supporter groups operating data analytics platforms

---

## Sources

- [Nielsen: Media Trends Shaping Sports Marketing for 2026](https://www.nielsen.com/insights/2025/tops-of-sports-2026/)
- [IMG Digital Trends 2026](https://www.img.com/digital-trends-2026)
- [Stats Perform: 2026 Fan Engagement, Monetisation & AI Trends Survey](https://www.statsperform.com/2026-sports-fan-engagement-monetisation-ai-trends-survey/)
- [WSC Sports: 2025-2026 Generational Fan Study](https://wsc-sports.com/blog/industry-insights/the-2025-2026-generational-fan-study/)
- [SportsFirst: Top Sports App Features 2026](https://www.sportsfirst.net/post/top-sports-app-features-every-team-needs-in-2026-sportsfirst)
- [BCG: Beyond Media Rights](https://www.bcg.com/publications/2026/beyond-media-rights-a-whole-new-ballgame-for-sports)
- [PwC: Sports Industry Outlook 2026](https://www.pwc.com/us/en/industries/tmt/library/sports-outlook-north-america.html)
- [The Athletic Profitability (Axios)](https://www.axios.com/2025/05/20/nyt-athletic-profitable)
- [The Athletic Newsletter Growth (The Drum)](https://www.thedrum.com/news/the-athletic-just-hit-5m-newsletter-subscribers-here-s-how-and-why-it-matters)
- [FiveThirtyEight Shutdown (Wikipedia)](https://en.wikipedia.org/wiki/FiveThirtyEight)
- [American Soccer Analysis](https://www.americansocceranalysis.com)
- [ASA Viz Hub](https://viz.americansocceranalysis.com/)
- [Stats Perform: Expected Goals (xG)](https://www.statsperform.com/resource/expected-goals-xg-the-football-metric-changing-analysis-betting-and-fan-engagement/)
- [StatsBomb / Hudl](https://www.hudl.com/products/statsbomb)
- [OneFootball + MLS NEXT Pro Partnership](https://www.revolutionsoccer.net/news/onefootball-becomes-the-new-home-of-mls-next-pro-matches-in-2026)
- [MLS 30th Season Fan Engagement](https://www.mlssoccer.com/news/mls-30th-regular-season-strength-scale-and-unmatched-fan-engagement)
- [Newsweek: Best MLS Supporters' Group 2025](https://www.newsweek.com/fans-choice/best-mls-supporters-group-2025)
- [amNewYork: Red Bulls Podcasts Fill NYC Media Void](https://www.amny.com/sports/red-bulls-nycfc-podcasts/)
- [2025 MLS Fan Survey (Burgundy Wave)](https://burgundywave.com/2025/12/29/2025-mls-fan-survey-ben-wright/)
- [Samford: 2026 World Cup Study](https://www.samford.edu/sports-analytics/fans/2025/2026-World-Cup-Study-What-Will-It-Actually-Take-to-Make-Soccer-Mainstream-in-America)
- [Sports Innovation Lab: US Soccer Fan Data](https://www.sportsilab.com/press/sportsilabxjungvonmattsportslaunch)
- [Storybench: How Tifo Football Makes Analytics Accessible](https://www.storybench.org/how-tifo-football-is-making-soccer-analytics-more-easy-to-digest/)
- [Patreon Statistics 2025](https://electroiq.com/stats/patreon-statistics/)
- [Substack Sports Newsletters](https://substack.com/top/sports)
- [IMG: The Short Form Fallacy](https://www.img.com/digital-trends-2026/trend/the-short-form-fallacy)
- [Dark Mode Web Design Trends 2025](https://designindc.com/blog/dark-mode-web-design-seo-ux-trends-for-2025/)
- [DesignRush: Best Sports Websites 2026](https://www.designrush.com/best-designs/websites/trends/best-sports-websites)
- [FotMob Player Ratings Explained](https://www.scribd.com/document/920258497/Stats-Definitions-FotMob)
- [WhoScored Ratings Explained](https://www.whoscored.com/explanations)
- [Reddit r/soccer Community Analysis](https://www.archyde.com/inside-the-wild-world-of-reddits-r-soccer-unpacking-daily-debates-and-discussions/)
- [Feedspot: 10 Best New York Red Bulls Blogs 2026](https://bloggers.feedspot.com/new_york_red_bulls_blogs/)
- [New York Red Bulls: South Ward Supporter Central](https://www.newyorkredbulls.com/supportercentral/southward)
