# South Ward Signal — Site Overhaul Design Brief

**Date**: 2026-03-11
**Status**: Approved
**Agents Consulted**: Trend Researcher, UX Researcher, Brand Guardian, UI Designer, Frontend Developer, Content Creator

---

## 1. Strategic Positioning

**Category**: Supporter Intelligence — the only MLS supporter group operating a data analytics platform.

**Brand Archetype**: The Signal Corps — the supporter who stands in the South Ward every match, voice raw from chanting, but who also pulls up xG scatter plots at halftime.

**Market Timing**: FiveThirtyEight shut down (March 2025) with no MLS successor. 2026 World Cup driving 400% YoY growth in US soccer fans.

**Name & Tagline**: Keep both.
- Primary: "Red Runs Deep."
- Descriptor: "Data-driven. Supporter-born."
- Full: "Independent RBNY coverage with advanced analytics from the South Ward to your screen."

---

## 2. Visual Direction: Matchday Noir

Keep the existing dark atmospheric system — genuinely distinctive.

### Color System (Refined)

| Role | Color | Hex | Notes |
|------|-------|-----|-------|
| Foundation | Near-black | #0A0A0C | Keep |
| Surface | Charcoal | #111114 | Keep |
| Elevated | Dark gray | #18181C | Keep |
| Surface 4 | Slate | #1F1F25 | New 4th elevation |
| Primary | Signal Red | #ED1A3D | Keep |
| Primary Light | Coral Red | #FF4D6A | Hovers, links |
| Secondary | Archive Gold | #D4A843 | Keep |
| Tertiary | Slate Blue | #557AB2 | New — data viz, opponent contexts (accessible) |
| Positive | Match Green | #22C55E | Win indicators |
| Negative | Loss Amber | #F59E0B | Warning states |
| Text Primary | Bright White | #F5F5F7 | Keep |
| Text Secondary | Cool Gray | #C8C8D0 | Keep |
| Text Tertiary | Mid Gray | #7F7F8B | Fixed from #6E6E7A for WCAG |
| Border | Dim Gray | #2A2A32 | Dividers |

### Typography (Keep All 3)
- Fraunces (display, 400/700/900)
- Source Sans 3 (body, 300/400/600/700)
- JetBrains Mono (data, 400/700)
- 9-step fluid type scale with clamp()

### Signature Elements
- Keep: Vertical red stripe, grid pattern, noise grain, red glow, smoke layers
- Add: Signal Pulse (data ripple), Redline separators, corner crop marks
- Remove: Custom cursor

---

## 3. Tech Stack

| Layer | Current | New |
|-------|---------|-----|
| Framework | Next.js 14.2 | Next.js 16 (React 19, Compiler, View Transitions, Turbopack) |
| UI Components | Custom | shadcn/ui (structural) + custom (data viz) |
| Animation | framer-motion 11 | motion + LazyMotion |
| Page Transitions | AnimatePresence | View Transitions API |
| Scroll Reveals | RevealOnScroll (JS) | CSS scroll-driven animations |
| Client Data | None | TanStack Query v5 |
| Real-time | None | Supabase Realtime (live matches only) |
| CMS Revalidation | Time-based (60s) | Ghost webhooks (instant) |
| Testing | None | Vitest + Playwright |
| Type Safety | Manual / any | Supabase gen types + Zod |
| Smooth Scroll | Lenis | Remove (or desktop-only) |
| GSAP | gsap 3.12 | Remove (unused) |
| Three.js | Eager dynamic | Keep, defer 2s, prefers-reduced-motion |

---

## 4. User Personas

| Persona | Who | Key Need |
|---------|-----|----------|
| Diego "The Lifer" | Season ticket holder | Post-match recaps fast, data validation |
| Aisha "The Scrolling Fan" | Casual mobile-first | Smart fan without feeling excluded |
| Ravi "The Analyst" | Data scientist | Export, methodology, novel insights |
| Marcus "The South Ward Soul" | Culture-first | Community, identity, ownership |

---

## 5. Features

### Match-Day Mode
- PRE-MATCH (6hrs before): Preview, lineups, predictions poll
- LIVE: Score ticker, live stats, match thread
- POST-MATCH (within 1hr): Recap, player ratings, xG analysis

### Community Layer
- Player ratings (1-10 per player per match)
- Prediction league with leaderboard
- Polls (MOTM, tactical)
- Fan-submitted content
- Comments via Hyvor Talk

### Content System (15 Types)
7 existing + 8 new: tactical analysis, data deep-dives, historical retrospectives, supporter culture, podcast show notes, photo galleries, infographics, opinion/editorial

### 3 Ghost Newsletters
- "The Signal" — weekly Monday digest
- "Match Day" — pre-match alert
- "The Data Sheet" — monthly analytics

### Social Feeds Integration
- X (Twitter) feed embed — primary social platform
- Instagram feed embed — visual content showcase
- Social proof on articles (share counts, engagement)
- Auto-sharing pipeline from Ghost → X, Instagram
- Social-first content types (stat drops, formation graphics)

### Data Room Upgrades
- Metric tooltips for every stat
- Progressive disclosure (summary → detail)
- Client-side filtering (TanStack Query)
- Data export capability
- Supabase Realtime for live matches

---

## 6. Information Architecture

```
Home (match-day aware)
├── Articles (15 content types, tag filtering)
│   └── [slug] (progress bar, ToC, comments, related, social sharing)
├── Data Room
│   ├── Overview (metrics + tooltips)
│   ├── Matches (filterable)
│   │   └── [matchId] (xG, shots, events, ratings)
│   ├── Players (sortable)
│   │   ├── [name] (radar, stats, history)
│   │   └── Compare (H2H)
│   ├── League (standings, trends)
│   ├── Team (metrics, trends)
│   └── Historical (season-over-season)
├── Community
│   ├── Predictions
│   ├── Polls
│   └── Fan Content
├── Social (X feed + Instagram feed)
├── About
└── Newsletter (signup + archive)
```

---

## 7. Voice & Tone

"Precise, not pedantic; passionate, not unhinged; independent, not antagonistic; insider, not exclusionary."

Three registers: Analytical Authority, Supporter Authenticity, Editorial Craft.

---

## 8. Accessibility

- sws-400 → #7F7F8B (WCAG AA fix)
- sws-500 → #5D5D6B (large text only)
- Slate Blue → #557AB2 (4.53:1)
- Red text on cards: 14px bold minimum
- prefers-reduced-motion support
- Skip-to-content link
- Touch targets 44px minimum
