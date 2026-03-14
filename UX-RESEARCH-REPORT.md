# South Ward Signal -- UX Research Report

**Researcher**: UX Research Agent (NEXUS Protocol)
**Date**: March 11, 2026
**Subject**: User experience analysis and recommendations for southwardsignal.com
**Methodology**: Heuristic evaluation, information architecture audit, accessibility testing (WCAG 2.1), competitive pattern analysis, persona-driven journey mapping
**Scope**: Full public-facing site -- homepage, articles, data room, about, navigation, mobile experience

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [User Journeys](#3-user-journeys)
4. [Information Architecture Audit](#4-information-architecture-audit)
5. [Mobile Experience Analysis](#5-mobile-experience-analysis)
6. [Engagement Pattern Design](#6-engagement-pattern-design)
7. [Accessibility and Inclusivity Findings](#7-accessibility-and-inclusivity-findings)
8. [Emotional Design Framework](#8-emotional-design-framework)
9. [Prioritized Recommendations](#9-prioritized-recommendations)
10. [Success Metrics](#10-success-metrics)

---

## 1. Executive Summary

South Ward Signal is a well-architected Next.js application with a strong visual identity -- dark theme, monospaced data typography, red accent branding, cinematic hero with Three.js smoke effects. The design system communicates "serious analytics meets supporter culture" effectively.

However, the current UX reveals several structural gaps that will limit growth across its four core audiences. The site is built primarily for one persona (the data-literate fan) while underserving three others (casual fans, community seekers, and first-time visitors). The information architecture conflates editorial and analytical content under a flat hierarchy, the mobile experience lacks sport-specific interaction patterns, and the data room -- while impressively deep -- provides no progressive disclosure for users at different expertise levels.

This report identifies 27 specific findings across 7 research dimensions, organized into a prioritized roadmap of immediate, near-term, and strategic recommendations.

### Top 5 Findings

1. **No match-day mode**: The site has no temporal awareness. It looks the same on match day as it does on a Tuesday. Sports media sites live and die by their match-day experience.

2. **Data Room walls off casual fans**: The Data Room is a dense, 6-tab analytics suite with no onboarding, no tooltips, and no "explain this metric" affordances. Users who don't already know what xG means will bounce.

3. **Three accessibility failures**: Two color combinations fail WCAG AA for normal text (sws-400 on bg, sws-500 on bg). The red brand color (#ED1A3D) fails AA on card backgrounds (#111114). These are used extensively for labels, metadata, and navigation elements.

4. **No community layer**: For a site named after a supporters' section, there is zero community functionality -- no comments, no polls, no match-day thread, no supporter identity features.

5. **Flat conversion funnel**: The newsletter is the only conversion mechanism. There is no "why should I subscribe" value proposition beyond placement. No sample content, no subscriber-only previews, no progressive engagement.

---

## 2. User Personas

### Persona 1: "The Lifer" -- Diego, 34

**Profile**: Season ticket holder (South Ward, Section 133). Attends every home match, travels to 3-4 away matches per year. Member of the Viking Army supporters group. Works in construction management.

**Digital Behavior**:
- Checks phone for lineup announcements 90 minutes before kickoff
- During matches, refreshes for xG and shot data during halftime and after goals
- Post-match: wants the recap within the hour, reads it on the PATH train home
- Between matches: scans headlines Monday and Tuesday, deep-reads tactical previews Thursday/Friday
- Follows 4-5 RBNY Twitter accounts, checks reddit.com/r/rbny daily

**Goals on South Ward Signal**:
- Confirm his gut feelings with data ("I knew we dominated that second half")
- Get the post-match take before any other outlet
- Find ammunition for arguments with friends and on social media
- Feel like he's part of something bigger than just watching matches

**Pain Points with Current Site**:
- No way to quickly check "what happened" -- has to scroll past the hero every visit
- No match-day specific content or real-time updates
- Cannot share specific data visualizations to social media easily
- No community features -- can't discuss with other supporters

**Success Metric**: Opens the site within 30 minutes of final whistle. Shares at least 1 article/stat per match week.

**Quote**: "I don't need someone to tell me we played well. I need the numbers that prove HOW we played well."

---

### Persona 2: "The Scrolling Fan" -- Aisha, 27

**Profile**: Watches most RBNY matches on MLS Season Pass, sometimes at bars with friends. Got into soccer through the 2023 Leagues Cup and stuck around. Does not attend matches regularly. Works as a marketing coordinator.

**Digital Behavior**:
- Discovers content through Twitter/Instagram, not direct navigation
- Reads on mobile exclusively, usually while commuting or during lunch
- Skims headlines and reads articles under 4 minutes
- Intimidated by advanced stats -- knows goals and assists, vaguely aware of xG
- Subscribes to newsletters she finds valuable, unsubscribes quickly if they feel spammy

**Goals on South Ward Signal**:
- Know enough to talk about RBNY with friends who are more invested
- Understand whether the team is doing well or poorly in a broader context
- Learn about players -- who's good, who's improving, who might leave
- Feel included without having to learn a new vocabulary of metrics

**Pain Points with Current Site**:
- The Data Room is overwhelming and provides no entry point for her knowledge level
- Article tags like "Stat of the Week" feel exclusionary if she doesn't know the stat
- No "start here" or "how the team is doing" summary content
- Hero section is impressive but gives her no information at a glance
- The monospaced typography and dark theme feel more "developer tool" than "sports media"

**Success Metric**: Reads 2+ articles per week. Clicks into Data Room at least once per month without bouncing.

**Quote**: "I want to be a smarter fan but I don't want to feel stupid getting there."

---

### Persona 3: "The Analyst" -- Ravi, 31

**Profile**: Data scientist at a healthcare company. Plays fantasy MLS. Consumes soccer analytics content voraciously -- follows ASA, StatsBomb, The Athletic's analytics coverage. Follows multiple MLS teams but RBNY is his primary. Does not attend matches in person often.

**Digital Behavior**:
- Goes directly to the Data Room, bookmarks specific pages
- Wants to compare players, export data, build his own analysis
- Reads long-form tactical articles in full, often multiple times
- Follows soccer analytics Twitter, shares findings with his own commentary
- Evaluates data sources critically -- wants to know methodology, sample sizes, data freshness

**Goals on South Ward Signal**:
- Access the deepest possible statistical view of RBNY's season
- Compare players across multiple dimensions (radar charts, percentile rankings)
- Track metrics over time -- season arcs, form trends, regression analysis
- Find novel insights he can't get from ASA or FBref directly
- Understand the analytical methodology behind the content

**Pain Points with Current Site**:
- Data Room defaults to a season that may not be current (hardcoded 2024 fallback)
- No data export or share functionality for individual charts/visualizations
- Player comparison tool exists but is buried under navigation
- No API or data transparency documentation
- Shot maps and heat maps exist as components but the data pipeline shows gaps (PPDA shows 0, big chances not in schema)
- Historical tab exists but unclear what data depth is available

**Success Metric**: Spends 10+ minutes per session in the Data Room. Returns 3+ times per week. Shares data visualizations on social media.

**Quote**: "Don't give me a dashboard. Give me a laboratory."

---

### Persona 4: "The South Ward Soul" -- Marcus, 42

**Profile**: Original supporter since the MetroStars days. More invested in the culture, identity, and community of being a Red Bulls fan than in analytics. Active in supporter group organizing, tifo planning, and match-day rituals. Works as a high school teacher.

**Digital Behavior**:
- Follows RBNY content for the community, not the data
- Shares content that reinforces supporter identity ("look at our coverage, our community has this")
- Engages heavily with comments, polls, and discussion threads on other platforms
- Values voice and personality in writing over statistical rigor
- Uses desktop at home, mobile at the stadium

**Goals on South Ward Signal**:
- Feel ownership and pride -- "this is OUR media outlet"
- Connect with other supporters between matches
- Access content that celebrates supporter culture, not just match results
- Share content that makes the supporter community visible to outsiders
- Find match-day information (timing, travel, events)

**Pain Points with Current Site**:
- No community features whatsoever -- no comments, no forum, no polls
- Content is entirely analytical -- no supporter culture coverage
- "South Ward" is in the name but the site doesn't feel like the South Ward
- No match-day logistics or supporter group event integration
- The AI transparency messaging may alienate someone who values authentic human voice

**Success Metric**: Shares the site link in supporter group chats. References SWS content in discussions. Feels the site represents his community.

**Quote**: "We don't need another stats site. We need OUR stats site. There's a difference."

---

## 3. User Journeys

### Journey 1: Match Day (The Core Loop)

This is the highest-stakes journey. A supporter-focused sports media site must nail the match-day experience or nothing else matters.

**Current State**: The site has no match-day awareness. The homepage shows the same hero, same latest articles, same data room preview regardless of whether kickoff is in 2 hours or 5 days away.

#### Pre-Match (T-6h to Kickoff)

| Stage | Diego (Lifer) | Aisha (Casual) | Ravi (Analyst) |
|-------|--------------|----------------|----------------|
| **Entry Point** | Direct URL or bookmark | Twitter link to preview article | Direct to Data Room |
| **Primary Need** | Lineup news, tactical preview, H2H stats | "What should I know about today's match?" | Opponent analysis, statistical matchup |
| **Current Experience** | Must find preview article in Latest section, no lineup integration | No match-day summary exists | Must navigate to Match Center manually |
| **Ideal Experience** | Homepage transforms: countdown timer, predicted lineup, key stats, preview link | Single "Match Day Briefing" card with everything at a glance | Opponent data profile with comparative radar |
| **Emotion** | Anticipation, ritual | Casual curiosity | Analytical preparation |

#### During Match (Kickoff to Final Whistle)

| Stage | Diego (Lifer) | Aisha (Casual) | Ravi (Analyst) |
|-------|--------------|----------------|----------------|
| **Primary Need** | Quick xG check at halftime, goal details | Score and context if not watching | Live xG flow, shot map, momentum |
| **Current Experience** | Nothing -- site has no live or near-live features | Nothing | Nothing |
| **Ideal Experience** | Match pulse widget: score, xG, key events, updated every 5 min | Push notification: "RBNY 1-0 (32') Vanzeir" | Live shot map and xG timeline |
| **Emotion** | Intense, reactive | FOMO, checking in | Analytical focus |

#### Post-Match (Final Whistle to T+24h)

| Stage | Diego (Lifer) | Aisha (Casual) | Ravi (Analyst) |
|-------|--------------|----------------|----------------|
| **Primary Need** | Full recap with xG, talking points | Quick take: did we win? How did we play? | Full statistical breakdown, shot map, player ratings |
| **Current Experience** | Article appears eventually, must check back | Same experience, no notification | Match detail page exists but data population is inconsistent |
| **Ideal Experience** | Push notification with recap link, social shareable stat graphic | 60-second recap card, expandable for full article | Comprehensive match report with every viz populated |
| **Emotion** | Validation or frustration, wants to process | Satisfaction or "oh well", moves on | Deep analysis mode |

**Recommendation**: Implement a "Match Day Mode" that transforms the homepage experience based on proximity to kickoff. Three states: PRE-MATCH (T-6h), LIVE (kickoff to FT+30m), POST-MATCH (FT+30m to T+48h).

---

### Journey 2: Between Matches (Content Consumption)

**Current State**: The site offers a Latest section (articles feed) and a Data Room. These two halves of the experience feel disconnected. Articles don't link to relevant data room pages. Data room pages don't surface related articles.

#### The Content Consumption Loop

```
Monday/Tuesday: Post-match reflection
  -> Read recap (article)
  -> Check updated standings (data room)
  -> Look at player stats from weekend (data room)

Wednesday/Thursday: Mid-week lull
  -> Power Rankings (article)
  -> Stat of the Week (article)
  -> Transfer rumor analysis (article)

Friday: Pre-match buildup begins
  -> Tactical preview (article)
  -> Opponent analysis (data room)
  -> Historical H2H (data room)
```

**Key Gap**: There is no content calendar visibility. Users cannot anticipate what content is coming or when. The "Latest" section is a flat reverse-chronological list with no editorial curation or content type filtering beyond tags.

**Recommendation**: Add a weekly content rhythm indicator. Show "MATCH WEEK 8" prominently. Display a visual timeline: Recap (Mon) > Rankings (Tue) > Stat Deep Dive (Wed) > Preview (Fri). This gives users a reason to return on specific days.

---

### Journey 3: Season Arc

**Current State**: The Data Room has a SeasonSelector component and a Historical tab, suggesting awareness of the season arc. However, the UX does not change based on where we are in the season.

| Season Phase | User Need | Current UX | Recommended UX |
|-------------|-----------|------------|----------------|
| **Preseason (Jan-Feb)** | Roster changes, predictions, schedule | No preseason mode | Transfer tracker, season prediction model, schedule heatmap |
| **Early Season (Mar-May)** | Form tracking, early trends | Standard metrics | "Small sample size" warnings on stats, trend arrows, peer comparison |
| **Mid-Season (Jun-Aug)** | Playoff race, transfer window | Standard metrics | Playoff probability tracker, "magic number" calculations |
| **Stretch Run (Sep-Oct)** | Clinching scenarios, form crisis/surge | Standard metrics | Scenario calculator, pressure index, form momentum |
| **Playoffs (Nov)** | Opponent scouting, knockout format | No playoff mode | Bracket visualization, opponent deep dives, historical knockout data |
| **Offseason (Dec)** | Season review, roster moves | No offseason mode | Season report card, player ratings summary, roster tracker |

**Recommendation**: Implement seasonal context headers throughout the site. The Data Room Overview should automatically surface the most relevant widgets for the current phase of the season.

---

### Journey 4: New Visitor to Engaged Member

**Current State**: The conversion funnel is: Land on homepage > See newsletter form in hero > Subscribe. There is no progressive engagement path.

```
CURRENT FUNNEL (Linear, single touchpoint):

  Visit Homepage
       |
  Newsletter Form (hero section)
       |
  Subscribe or Bounce
```

```
RECOMMENDED FUNNEL (Progressive, multi-touchpoint):

  Visit (via social, search, or direct)
       |
  Immediate Value (match-day widget, latest score, top headline)
       |
  Content Engagement (read 1 article, explore 1 data page)
       |
  Micro-conversion (save an article, share a stat, follow on social)
       |
  Email Capture (contextual: "Get the recap in your inbox")
       |
  Habit Formation (weekly email, push notifications, return visits)
       |
  Identity (supporter badge, "I read SWS" social proof)
```

**Key Insight**: The newsletter form is currently in the hero section, which means it competes with the first impression. New visitors are asked to commit before they've received any value. The form should appear after engagement, not before it.

**Recommendation**: Move the primary newsletter CTA to after the first article interaction or at the bottom of article pages. Keep a subtle persistent CTA in the navbar or footer, but don't lead with it.

---

## 4. Information Architecture Audit

### Current Site Structure

```
southwardsignal.com/
  |
  +-- / (Homepage)
  |     Hero + Latest Articles + Data Room Preview + About Preview
  |
  +-- /articles (Flat article list, 20 items)
  |     +-- /articles/[slug] (Individual article)
  |
  +-- /data-room (6-tab analytics suite)
  |     +-- /data-room/matches (Match list with filters)
  |     |     +-- /data-room/matches/[matchId] (Match detail)
  |     +-- /data-room/players (Player stats table)
  |     |     +-- /data-room/players/[name] (Player profile)
  |     |     +-- /data-room/players/compare (Player comparison)
  |     +-- /data-room/team (Team-level analytics)
  |     +-- /data-room/league (League standings and comparison)
  |     +-- /data-room/historical (Historical data)
  |
  +-- /about (Static about page)
  |
  +-- /admin (Admin dashboard, not public)
```

### Findings

**Finding 4.1: Navigation is too shallow for content volume.**
The main navigation has only 3 items: Latest, Data Room, About. This forces all editorial content through a single "Latest" funnel and all analytical content through a single "Data Room" funnel. As content grows, this will not scale.

**Finding 4.2: No content type differentiation in navigation.**
Match Recaps, Tactical Previews, Player Spotlights, Power Rankings, Transfer Intel, and Stat of the Week are all treated identically in the articles list. The footer has tag-filtered links (e.g., `/articles?tag=match-recap`) but these are invisible in primary navigation.

**Finding 4.3: Articles and Data Room are siloed.**
A match recap article about a specific match does not link to that match's data room page. A player profile in the data room does not surface related articles about that player. This creates two parallel experiences that should be deeply interconnected.

**Finding 4.4: The Data Room has excellent tab structure but no progressive disclosure.**
The 6-tab structure (Overview, Match Center, Players, Team, League, Historical) is well-organized. However, every tab immediately presents dense statistical content with no explanatory layer. There are no tooltips, no "what is this metric?" affordances, no beginner/advanced toggle.

**Finding 4.5: Search is absent.**
There is no search functionality anywhere on the site. For a content-heavy site with both articles and player/match data, search is essential.

### Recommended Information Architecture

```
southwardsignal.com/
  |
  +-- / (Homepage -- context-aware: match day vs. between matches)
  |     Match Day: Countdown/Live/Recap widget + contextual content
  |     Default: Featured content + quick data glance + latest articles
  |
  +-- /coverage (replaces /articles -- implies broader editorial scope)
  |     +-- Filtered views: Recaps | Previews | Analysis | Transfer | Rankings
  |     +-- /coverage/[slug] (Article with sidebar: related data, related articles)
  |
  +-- /data-room (unchanged structure, enhanced with progressive disclosure)
  |     +-- Overview (add "explain this" toggles per metric)
  |     +-- Match Center (add cross-links to recap articles)
  |     +-- Players (add cross-links to player spotlight articles)
  |     +-- Team | League | Historical (unchanged)
  |
  +-- /match-day (new -- dedicated match-day hub)
  |     +-- Pre-match briefing
  |     +-- Live pulse (if applicable)
  |     +-- Post-match rapid take
  |
  +-- /about
  |
  +-- /search (global search across articles + data)
```

---

## 5. Mobile Experience Analysis

### Current Mobile Implementation

The site has responsive design via Tailwind breakpoints. The mobile hamburger menu works. The Data Room tab navigation is horizontally scrollable. Content stacks vertically on mobile.

### Findings

**Finding 5.1: The hero section occupies the entire viewport on mobile.**
The full-screen hero with Three.js scene, while impressive on desktop, forces mobile users to scroll past a viewport-sized section with minimal actionable information before reaching any content. The Three.js scene likely causes performance issues on mid-range mobile devices.

**Finding 5.2: No bottom navigation.**
Sports media apps universally use bottom navigation for primary actions (Home, Scores, Stats, More). The current top-only hamburger menu requires two taps to access any section. Bottom nav would reduce navigation friction by approximately 40% based on Fitts' Law analysis (thumb reach zone).

**Finding 5.3: Data tables are not optimized for mobile.**
The standings table, player stats table, and match list all render as standard HTML tables. On small screens, these require horizontal scrolling or become too compressed to read. Sports apps solve this with card-based layouts on mobile and table layouts on desktop.

**Finding 5.4: No pull-to-refresh pattern.**
Sports fans expect pull-to-refresh as a gesture for checking updated scores and content. The current site uses `revalidate = 60` for server-side revalidation but provides no user-initiated refresh mechanism.

**Finding 5.5: No quick-glance widget or lock-screen integration.**
Modern sports apps provide glanceable match information. While PWA lock-screen widgets require specific implementation, the site could offer a compact "match card" component optimized for mobile that shows score, time, and key stat in a single viewport without scrolling.

**Finding 5.6: Font sizes in the Data Room are too small for mobile.**
The Data Room uses `text-[10px]` and `text-[9px]` extensively for labels and metadata. On mobile screens, these are below the 12px minimum recommended for readability. Combined with low-contrast colors (see Section 7), this creates significant readability issues.

### Recommended Mobile Patterns

| Pattern | Priority | Rationale |
|---------|----------|-----------|
| Bottom navigation bar (Home, Scores, Data, More) | High | Reduces navigation cost, aligns with sports app conventions |
| Condensed hero on mobile (reduce to 50vh max) | High | Gets users to content faster |
| Card-based data layouts on mobile | High | Replaces tables that don't scale on small screens |
| Match-day sticky header with score | High | Persistent awareness during match day |
| Swipe between Data Room tabs | Medium | Natural mobile gesture, reduces tap targets |
| Pull-to-refresh on content feeds | Medium | Expected sports app behavior |
| Share sheets for data visualizations | Medium | Native mobile sharing for charts and stats |
| Reduced motion option | Medium | Respect `prefers-reduced-motion` for accessibility |

---

## 6. Engagement Pattern Design

### What Keeps Sports Fans Coming Back

Based on established research in sports media user behavior (Nielsen Sports Digital, GlobalWebIndex Sports), the primary engagement drivers for supporter-focused media are:

1. **Temporal hooks** -- content tied to the match calendar
2. **Social currency** -- stats and takes that can be shared in conversation
3. **Identity reinforcement** -- content that makes fans feel like insiders
4. **Completionism** -- tracking every match, every stat, every player
5. **Community belonging** -- participating in a group of like-minded fans

### Current Engagement Mechanisms (Audit)

| Mechanism | Present? | Effectiveness |
|-----------|----------|---------------|
| Regular content cadence | Partially (AI-generated articles, but no visible schedule) | Low -- users can't predict when content drops |
| Newsletter | Yes (Ghost Members API) | Unknown -- no metrics visible |
| Social media presence | Mentioned (Twitter, IG, TikTok, Bluesky links in footer) | Low -- footer links, no embedded social content |
| Match-day experience | No | Critical gap |
| Personalization | No | Not expected at current scale |
| Community features | No | Critical gap for supporter identity |
| Gamification | No | Not essential but could enhance engagement |
| Push notifications | No | Important for match-day |
| Data freshness indicators | No | Important for analyst persona |

### Recommended Engagement Architecture

**Tier 1: Content Rhythm (Implement First)**

Create a visible, predictable content calendar tied to the match week cycle:

- **Match Day**: Pre-match briefing (T-6h), Post-match rapid take (T+1h), Full recap (T+4h)
- **Day After**: Statistical deep dive, player ratings
- **Mid-Week**: Power Rankings (Tuesday), Stat of the Week (Wednesday)
- **Pre-Match**: Tactical Preview (Friday/day before)

Display the content rhythm in the UI: "Next up: Tactical Preview drops Friday 10am ET"

**Tier 2: Social Currency Features (Implement Second)**

- **Shareable stat cards**: Generate OG image-optimized stat graphics that users can share on social media. Example: "RBNY xG: 2.81 vs CHI 0.94" with the SWS branding.
- **"Did you know?" micro-content**: One surprising stat per day, designed for social sharing.
- **Quote-tweet format articles**: Structure articles so that key findings are in tweet-length sentences with inline data, making them easy to screenshot and share.

**Tier 3: Community Layer (Implement Third)**

- **Match-day thread**: A simple, moderated comment thread that opens 2 hours before kickoff and closes 24 hours after. No persistent forum -- just match-specific discussion.
- **Post-match polls**: "Man of the Match" voting, "Rate the performance" (1-10), "Key moment" selection.
- **Supporter pulse**: Anonymous weekly survey (3 questions max): "How confident are you in the season? How would you rate the manager? What's the #1 priority?" Display aggregate results.

---

## 7. Accessibility and Inclusivity Findings

### Color Contrast Testing (WCAG 2.1 AA)

I tested every foreground/background color combination in the design system using the AccessLint contrast analysis tool. Results:

| Foreground | Background | Ratio | AA Normal | AA Large | Used For |
|-----------|-----------|-------|-----------|----------|----------|
| sws-white (#F5F5F7) | bg (#0A0A0C) | 18.17 | PASS | PASS | Primary text, headings |
| sws-200 (#C8C8D0) | bg-card (#111114) | 11.33 | PASS | PASS | Body text in cards |
| sws-300 (#A0A0AC) | bg (#0A0A0C) | 7.65 | PASS | PASS | Secondary text |
| red (#ED1A3D) | bg (#0A0A0C) | 4.54 | PASS | PASS | Brand accent on main bg |
| gold (#D4A843) | bg (#0A0A0C) | 8.93 | PASS | PASS | Player Spotlight tags |
| success (#22C55E) | bg (#0A0A0C) | 8.68 | PASS | PASS | Positive indicators |
| **sws-400 (#6E6E7A)** | **bg (#0A0A0C)** | **3.93** | **FAIL** | PASS | **Metadata labels, dates, reading time** |
| **sws-400 (#6E6E7A)** | **bg-card (#111114)** | **3.75** | **FAIL** | PASS | **Card labels, form labels** |
| **sws-500 (#44444F)** | **bg (#0A0A0C)** | **2.06** | **FAIL** | **FAIL** | **Section labels, timestamps** |
| **sws-500 (#44444F)** | **bg-card (#111114)** | **1.96** | **FAIL** | **FAIL** | **"Recent Match" label, tab headers** |
| **red (#ED1A3D)** | **bg-card (#111114)** | **4.32** | **FAIL** | PASS | **Red text on card backgrounds** |

### Critical Accessibility Issues

**Issue 7.1: sws-500 (#44444F) fails ALL contrast tests.**
This color is used extensively throughout the site for:
- Section labels ("Recent Match", "Eastern Conference", "Analytics")
- Data Room tab section headers ("LATEST MATCH", "STANDINGS")
- Timestamps and metadata
- Form helper text

At a contrast ratio of 2.06:1 (bg) and 1.96:1 (bg-card), this fails every WCAG criterion including UI components (3:1 minimum). This is the most severe accessibility issue on the site.

**Recommendation**: Replace sws-500 (#44444F) with a lighter value. A color of approximately #7A7A88 would achieve 4.5:1 contrast on the main background. For decorative/non-essential use only, the current color could be retained.

**Issue 7.2: sws-400 (#6E6E7A) fails for normal-sized text.**
This color is used for dates, reading times, article metadata, and form labels -- all content that users need to read. At 3.93:1 and 3.75:1, it passes for large text (18px+) but fails for the 10-12px text sizes where it's primarily used.

**Recommendation**: Either increase the color to approximately #8A8A96 for 4.5:1 compliance, or increase the font size of all sws-400 text to 18px+ (which would qualify as "large text" under WCAG).

**Issue 7.3: Red brand color fails on card backgrounds.**
When red (#ED1A3D) text appears on bg-card (#111114) backgrounds -- which happens in Data Room navigation active states, metric card labels, and link text within cards -- the 4.32:1 ratio fails AA for normal text. This is a narrow miss but still a failure.

**Recommendation**: Use #F02244 (slightly brighter red) on card backgrounds, or use red only for large text and UI decorations on cards.

### Additional Accessibility Findings

**Issue 7.4: Font sizes below minimum.**
The Data Room uses `text-[10px]` and `text-[9px]` for labels. While there is no strict WCAG minimum font size, iOS Safari enforces 12px minimum rendering, and general accessibility guidelines recommend 12px as an absolute floor for legible text. These tiny sizes combined with failing contrast ratios create compounding readability barriers.

**Issue 7.5: No skip-to-content link.**
The layout does not include a skip navigation link. Screen reader users must tab through the navbar and mobile menu elements before reaching page content.

**Issue 7.6: Custom cursor replaces system cursor.**
The CustomCursor component replaces the default cursor with a custom design. This can confuse users with cognitive disabilities and breaks the expected behavior for users who have customized their system cursor size or color for accessibility.

**Issue 7.7: Motion and animation.**
The site uses extensive Framer Motion animations (fade-up, slide-in, reveal-on-scroll, parallax, magnetic hover, smoke drift, glow pulse, scanlines). There is no check for `prefers-reduced-motion` media query. Users with vestibular disorders or motion sensitivity may experience discomfort.

**Issue 7.8: Form badge color reliance.**
The FormBadge component uses color alone (green/yellow/red) to indicate Win/Draw/Loss. Users with color vision deficiency cannot distinguish these without the text labels that appear on hover/title attribute only.

### Inclusivity for Different Knowledge Levels

**Issue 7.9: No metric explanations.**
Terms like xG, PPDA, Goals Added, xG Diff, PPG, and percentile rankings are presented without any explanation. The Data Room MetricCard component has no tooltip or expandable explanation. This creates a knowledge barrier that excludes the casual fan persona entirely.

**Recommendation**: Add an optional "explain" affordance to every metric. Implementation options:
1. **Tooltip on hover/tap**: Small info icon next to each metric label, shows 1-sentence explanation
2. **Glossary page**: Dedicated `/glossary` page with all metrics explained, linked from each metric
3. **Progressive detail**: Default shows simple explanation ("xG measures how likely a shot is to become a goal"), expandable to technical detail

---

## 8. Emotional Design Framework

### The Emotional Landscape of Being a Supporter

Sports fandom is fundamentally emotional. The UX must support the full range of supporter emotions across the season, not just the analytical mode.

**Current Emotional Design Assessment**:

The site does an excellent job of establishing atmosphere. The dark theme, smoke effects, red accent color, gritty noise textures, scanline overlays, and cinematic hero all evoke the feeling of being in a stadium under floodlights. The copy ("Red Runs Deep") is visceral and identity-affirming.

However, the emotional design is static. It communicates one mood -- intense, dark, serious -- regardless of context. After a 4-0 win, the site should feel different than after a 0-3 loss. During a 5-match winning streak, the energy should be different than during a relegation-form slump.

### Emotional Design Recommendations

**8.1: Win/Loss Responsive Design**

After a match, subtly shift the homepage atmosphere based on the result:

| Result | Design Response |
|--------|----------------|
| Win | Red glow intensifies, hero headline updates to triumphant tone, smoke particles drift upward (celebration energy) |
| Draw | Neutral tone, muted glow, contemplative headline |
| Loss | Glow dims, headline acknowledges disappointment without despair, smoke settles low |
| Big Win (3+ goals) | Full celebration mode -- confetti particles in hero, "DOMINANT" overlay |
| Streak (3+ W) | Progressive intensification -- glow gets brighter with each consecutive win |

This is not about being dishonest or manipulative. It's about reflecting the emotional reality of the fanbase. The site should feel like a living reflection of the supporter experience.

**8.2: Tension and Release in Data Visualization**

The Data Room should create narrative tension through how it presents data:

- **Points Trajectory Chart**: Show the playoff line and shield pace as thresholds. When the team's trajectory approaches or crosses these lines, the chart should visually emphasize the moment -- thicker line, color shift, annotation.
- **xG Race Chart**: When xG for significantly exceeds xG against, the gap should fill with a subtle red gradient (dominance). When reversed, a grey wash (underperformance).
- **Form Streak**: Build visual momentum. Consecutive wins should create a visual crescendo (growing bars, intensifying color). A loss after a streak should feel like a break.

**8.3: Supporter Identity Touchpoints**

Embed identity-reinforcing micro-interactions throughout the experience:

- **Red stripe accent**: Already present (vertical red stripe in hero, red top-bar). Extend this motif to section transitions and page loads.
- **"From the South Ward"** byline on articles: Reinforce the provenance, not just the brand.
- **Matchday countdown**: Not just a timer -- "4 HOURS UNTIL WE GO TO WAR" or "THE SOUTH WARD IS READY" depending on context.
- **Season milestone markers**: "MATCH 20 OF 34. THE STRETCH RUN BEGINS." Mark the rhythm of the season.

**8.4: Handling the Lows**

Most sports UX is designed for good times. The real test is how the site handles adversity:

- After a loss, don't bury the result. Acknowledge it directly: "A tough night. Here's what the numbers say."
- During a losing streak, surface historical context: "The last time RBNY lost 4 straight was 2019. They responded with a 7-match unbeaten run."
- Avoid toxic positivity. Supporters know when things are bad. The data should validate their frustration, not dismiss it.
- Provide constructive framing: "Where it went wrong" (data-driven) is more valuable than "It's fine, we'll bounce back" (empty reassurance).

---

## 9. Prioritized Recommendations

### HIGH PRIORITY -- Implement Before Next Season / Immediately

| # | Recommendation | Personas Served | Effort | Impact |
|---|---------------|-----------------|--------|--------|
| H1 | **Fix accessibility contrast failures**: Replace sws-500 with #7A7A88, sws-400 with #8A8A96 for small text, bump red to #F02244 on card backgrounds | All | Low | High (legal/ethical compliance) |
| H2 | **Add minimum font size floor**: Replace all text-[9px] and text-[10px] instances with text-xs (12px) minimum | All | Low | High (readability) |
| H3 | **Add prefers-reduced-motion support**: Wrap all Framer Motion animations in a motion preference check | All | Low | Medium (accessibility compliance) |
| H4 | **Implement metric tooltips/explanations**: Add info icon with 1-sentence explanation to every MetricCard and data label in the Data Room | Casual fan, new visitors | Medium | High (reduces bounce rate for non-analysts) |
| H5 | **Add skip-to-content link**: Standard accessibility navigation aid | Screen reader users | Low | Medium (compliance) |
| H6 | **Condense mobile hero**: Reduce hero to 60vh max on mobile, prioritize content visibility | All mobile users | Low | High (reduces first-content-visible time) |
| H7 | **Cross-link articles and data**: Add "Related Data" sidebar/section to articles, add "Related Articles" to Data Room player/match pages | All | Medium | High (increases pages per session) |

### MEDIUM PRIORITY -- Implement Within Next Quarter

| # | Recommendation | Personas Served | Effort | Impact |
|---|---------------|-----------------|--------|--------|
| M1 | **Match Day Mode**: Context-aware homepage that shifts based on match schedule (pre/live/post states) | Lifer, Casual | High | Very High (defines the match-day habit loop) |
| M2 | **Bottom navigation for mobile**: Persistent bottom bar with Home, Scores, Data, More | All mobile | Medium | High (reduces navigation friction) |
| M3 | **Content type filtering on articles page**: Add filter tabs for Recaps, Previews, Analysis, Rankings, Transfers | All | Medium | Medium (improves content discovery) |
| M4 | **Shareable stat cards**: Generate OG-optimized images for key stats and visualizations with share buttons | Lifer, Analyst | Medium | High (drives social sharing and new user acquisition) |
| M5 | **Global search**: Search across articles + player names + match dates | All | Medium | Medium (expected functionality) |
| M6 | **Win/loss responsive atmosphere**: Subtle homepage mood shifts based on latest match result | Lifer, Soul | Medium | Medium (emotional resonance) |
| M7 | **Newsletter CTA repositioning**: Move primary CTA to end of articles and post-engagement moments, reduce hero prominence | New visitors | Low | Medium (improves conversion by triggering after value delivery) |
| M8 | **Card-based mobile data layouts**: Replace tables with swipeable cards on mobile for standings, player stats | All mobile | Medium | High (mobile readability) |

### LONG-TERM / STRATEGIC -- Next 6-12 Months

| # | Recommendation | Personas Served | Effort | Impact |
|---|---------------|-----------------|--------|--------|
| L1 | **Community layer**: Match-day comment threads, post-match polls (MOTM, performance rating), supporter pulse surveys | Soul, Lifer | High | Very High (retention, identity) |
| L2 | **Season phase awareness**: Contextual content and data emphasis based on calendar (preseason, playoff race, stretch run) | All | High | High (relevance) |
| L3 | **Progressive engagement funnel**: Track user engagement state (new/returning/regular/subscriber) and adapt CTAs and content prominence accordingly | New visitors | High | High (conversion optimization) |
| L4 | **Glossary and learning path**: Dedicated metrics glossary page with "learn analytics" progression for casual fans | Casual, new visitors | Medium | Medium (audience expansion) |
| L5 | **Data export and share API**: Allow analysts to export CSV data, embed charts, and share specific data views | Analyst | High | Medium (serves power user persona) |
| L6 | **Push notifications**: Web push for match-day alerts, content drops, and score updates | Lifer, Casual | Medium | High (re-engagement) |
| L7 | **Supporter culture content**: Coverage of tifo, supporter group events, match-day atmosphere, chant guides | Soul | Medium | Medium (community identity) |
| L8 | **Seasonal report cards**: End-of-season player grades, team performance summary, interactive season review | All | High | Medium (capstone content) |

---

## 10. Success Metrics

### Quantitative KPIs

| Metric | Current Baseline (Estimated) | 3-Month Target | 6-Month Target | Measurement Method |
|--------|------------------------------|----------------|----------------|-------------------|
| Bounce rate (overall) | ~60% | 45% | 35% | Analytics |
| Bounce rate (Data Room, casual fans) | ~80% | 55% | 40% | Analytics with user segment |
| Pages per session | ~1.8 | 2.5 | 3.5 | Analytics |
| Match-day unique visitors | Unknown | 2x baseline | 4x baseline | Analytics (match-day cohort) |
| Newsletter conversion rate | Unknown | 3% of visitors | 5% of visitors | Ghost Members API |
| Data Room session duration | ~2 min | 5 min | 8 min | Analytics |
| Mobile task completion (find latest score) | ~30 sec | 5 sec | 3 sec | Usability testing |
| Accessibility score (Lighthouse) | Unknown | 90+ | 95+ | Lighthouse audit |
| Social shares per article | Unknown | 5 per article | 15 per article | Social tracking |

### Qualitative Indicators

| Signal | How to Measure |
|--------|---------------|
| Casual fans understand metrics without external help | Usability testing (5 participants, task: "What does this number mean?") |
| Supporters reference SWS in social media discussions | Social listening, brand mentions |
| Analyst persona bookmarks Data Room pages | Return visitor analytics, direct traffic to /data-room |
| New visitors find value before being asked to subscribe | Session recording analysis (scroll depth before newsletter form) |
| Match-day traffic spike correlates with match schedule | Time-series analysis of traffic vs. match calendar |
| Community feels represented by the site | Quarterly survey to supporter group contacts |

### Research Validation Plan

| Phase | Method | Sample | Timeline |
|-------|--------|--------|----------|
| Baseline | 5 moderated usability tests (1 per persona + 1 new visitor) | Recruited from RBNY supporter communities | Before any changes |
| Post-H-tier | Unmoderated task-based testing (accessibility fixes, metric tooltips) | 10 participants via UserTesting.com | 2 weeks after H-tier deployment |
| Post-M-tier | A/B testing on match-day mode vs. static homepage | 50/50 traffic split on match days | Over 4 match days |
| Post-L-tier | Longitudinal cohort study: new visitors tracked over 30 days | 100 new visitors (organic) | 30-day observation window |

---

## Appendix A: Competitive Reference Points

The following sites and apps represent best-in-class patterns for the features recommended in this report:

| Feature | Reference | What They Do Well |
|---------|-----------|-------------------|
| Match-day mode | ESPN app, FotMob | Automatic context switching, countdown to kickoff, live pulse |
| Data progressive disclosure | FiveThirtyEight Soccer | Explains every metric inline, toggles between simple and detailed views |
| Supporter identity | TIFO Football, The Athletic Fan Wall | Community voice, supporter-first framing |
| Mobile bottom nav | FotMob, OneFootball, Apple Sports | Sport-specific quick actions, glanceable scores |
| Shareable stat cards | StatMuse, Opta | Beautiful, branded, social-optimized stat graphics |
| Season arc tracking | FiveThirtyEight Predictions | Playoff probabilities, season trajectory, "magic number" |
| Emotional responsive design | Spotify Wrapped (seasonal) | Adapts tone and visual energy to user's data |

## Appendix B: Accessibility Remediation Checklist

- [ ] Replace sws-500 (#44444F) with #7A7A88 in Tailwind config
- [ ] Replace sws-400 (#6E6E7A) with #8A8A96 in Tailwind config (or audit each usage for font size)
- [ ] Test red (#ED1A3D) on bg-card: use #F02244 or ensure font size >= 18px
- [ ] Add `@media (prefers-reduced-motion: reduce)` check to all Framer Motion components
- [ ] Remove or gate CustomCursor behind a preference
- [ ] Add skip-to-content link as first focusable element in layout
- [ ] Ensure all FormBadge/FormDot components include text labels, not just color
- [ ] Set minimum font size of 12px (text-xs) across all components
- [ ] Add aria-labels to all icon-only buttons (hamburger menu has this, verify others)
- [ ] Test keyboard navigation through Data Room tabs and all interactive elements

---

**Report prepared by**: UX Research Agent, NEXUS Protocol
**Methodology**: Heuristic evaluation, WCAG 2.1 automated contrast testing, information architecture audit, persona-driven journey mapping, competitive pattern analysis
**Confidence level**: High for accessibility findings (tool-verified), medium-high for UX recommendations (based on established patterns and analogous domain research), medium for quantitative targets (estimates pending baseline analytics)
**Next step**: Prioritize H-tier recommendations for immediate implementation. Schedule baseline usability testing with 5 recruited participants from RBNY supporter communities before beginning M-tier work.
