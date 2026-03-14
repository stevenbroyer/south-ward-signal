# South Ward Signal -- UI Design System
## "Matchday Noir" Visual Direction

**Prepared by**: UI Designer Agent
**Date**: 2026-03-11
**Status**: Design Specification -- Ready for Implementation
**Stack**: Next.js 14 + Tailwind CSS + Framer Motion + Recharts

---

## Table of Contents

1. [Layout Patterns](#1-layout-patterns)
2. [Component Design System](#2-component-design-system)
3. [Motion & Interaction Design](#3-motion--interaction-design)
4. [Dark Mode Best Practices](#4-dark-mode-best-practices)
5. [Typography System](#5-typography-system)
6. [Responsive Strategy](#6-responsive-strategy)
7. [Signature Visual Elements](#7-signature-visual-elements)
8. [Accessibility Audit & Fixes](#8-accessibility-audit--fixes)
9. [Revised Design Tokens](#9-revised-design-tokens)

---

## 1. Layout Patterns

### Research Findings

After analyzing FotMob, ESPN, The Athletic, StatsBomb, American Soccer Analysis,
and MLSsoccer.com, clear patterns emerge for content+data hybrid sports media:

- **FotMob** uses a 3-column desktop layout (308-632-308px) collapsing to single-column mobile. Data tables are the primary surface; editorial is secondary.
- **ESPN** leads with editorial hero cards and embeds scoreboards inline. Grid-based card layouts for article discovery. Sticky header navigation.
- **The Athletic** prioritizes long-form reading with narrow column widths (~680px), generous whitespace, and a sidebar for related content.
- **MLS** uses a sticky header, scoreboard ticker, and card-based content blending editorial with data.

### Homepage Structure

```
[=== Red accent line (2px) =====================================]
[=== Sticky Navbar (64px h) ====================================]

[=== Hero Section (100vh) ======================================]
  Three.js scene + smoke atmosphere
  Headline / subtitle / newsletter CTA
  Animated stat counters
  Scroll indicator

[=== Latest Section (py-24 to py-32) ===========================]
  Section header: "Latest" + gradient rule + "View all" link
  Grid: Featured article (left 50%) | Article list (right 50%)
  Featured: 16:10 aspect ratio card with tag overlay + xG viz
  List: 4 compact rows with date, tag badge, title

[=== Data Room Preview (py-24 to py-32) ========================]
  Section header: "Data Room" + gradient rule + deep link
  Grid: Match scoreboard card (left) | Mini standings (right)
  Both cards: bg-card + border + rounded-lg

[=== About Preview (py-24 to py-32) ============================]
  Brand story, mission statement, newsletter repeat CTA

[=== Footer ====================================================]
  4-column grid: Brand | Coverage | Data | Social
  Bottom bar: copyright + data attribution
```

**Key dimensions:**
- Max container: `1280px` (keep as-is)
- Horizontal padding: `24px` (px-6)
- Section vertical padding: `96px` / `128px` (py-24 / py-32)
- Section divider: 1px line with red gradient bleed from 7% left

### Article Page Layout

```
[=== Breadcrumb nav ============================================]

Grid: [Main content (1fr)] [Sidebar (320px)]

Main Content:
  Tag badge
  H1 title (max-width: 960px for readability)
  Meta: date + reading time
  Feature image (16:9, rounded-xl)
  Article body (max-width: 960px, "article-content" class)
  AI transparency disclosure

Sidebar (sticky, top-24):
  Related coverage card
  [Future: newsletter CTA, ad slot, social links]
```

**Recommended refinement:** Add a "reading progress bar" at the top of the
viewport (thin red line that fills left-to-right as the user scrolls through
the article body). This matches the existing red accent line aesthetic.

### Data Room Dashboard Layout

```
[=== Data Room Header ==========================================]
  "Analytics" label (red, mono, xs)
  H1 "Data Room" (display font, 4xl/5xl)
  Description (sws-400)
  Season selector (right-aligned)
  Tab navigation (pill-style horizontal tabs)

[=== Page Content (varies by tab) ==============================]

Overview Tab:
  6-col metric card grid (2-col mobile, 3-col tablet, 6-col desktop)
  Section: "Latest Match" -- 2-col (scoreboard | form streak)
  Section: "xG Race & Points Trajectory" -- 2-col charts
  Section: "Top Performers" -- 3-col player cards
  Section: "Standings" -- full-width table

Match Center Tab:
  Filter bar (result + venue pill toggles)
  "Upcoming" section: 3-col match card grid
  "Results" section: 3-col match card grid

Players Tab:
  Sortable data table with player stats

Team Tab:
  Team-level analytics and comparison charts

League Tab:
  Full standings table + league-wide comparisons
```

### Match Detail Page Layout

```
[=== Back link ("All Matches") =================================]
[=== Score Header Card (full-width, centered) ==================]
  Date + venue (mono, 10px)
  Home team -- Score -- Away team (centered, 5xl scores)
  xG line

[=== 2-col: xG Timeline | Shot Map ============================]
[=== 2-col: Event Timeline | Stat Comparison Bars ==============]
[=== Full-width: Momentum Chart ================================]
[=== 2-col: Average Positions | H2H History ====================]
[=== Full-width: Player Rating Grid ============================]
```

**Recommended addition:** Add a "sticky match header" that condenses the score
into a compact bar when the user scrolls past the main score header. Shows
"NYRB 2 - 1 OPP" in a thin glass-morphism bar beneath the navbar.

### Player Profile Page Layout

```
[=== Player Header Card ========================================]
  Avatar (80px circle) | Position + number + name
  Metadata: nationality, age, foot, height

[=== 6-col Metric Cards =======================================]
  Games, Minutes, Goals, Assists, xG, Goals Added

[=== 2-col: Radar Chart | Goals Added Breakdown ===============]
[=== Full-width: Season Progression Chart ======================]
[=== Full-width: Market Value Chart ============================]
[=== Full-width: Match Log Table ===============================]
[=== Full-width: Season History Table ==========================]
```

### Grid System Rules

| Breakpoint | Columns | Gap   | Container Max | Padding |
|-----------|---------|-------|---------------|---------|
| < 640px   | 1       | 12px  | 100%          | 16px    |
| 640-767px | 2       | 16px  | 640px         | 24px    |
| 768-1023px| 2-3     | 16px  | 768px         | 24px    |
| 1024-1279px| 2-4    | 24px  | 1024px        | 24px    |
| >= 1280px | 2-6     | 24px  | 1280px        | 32px    |

---

## 2. Component Design System

### 2.1 Cards

#### Metric Card (existing -- refine)
```
Dimensions:  Fluid width, min-height 88px
Padding:     20px (p-5)
Background:  bg-card (#111114)
Border:      1px solid sws-700/50 (#1E1E24 at 50% opacity)
Radius:      8px (rounded-lg)
Shadow:      None (elevation via background color)
Label:       font-mono, 12px, sws-400, uppercase, tracking-widest
Value:       font-body, 30px (text-3xl), font-bold, sws-white
Trend arrow: 12x12px SVG, success/red color
Hover:       No hover state (display-only)
```

#### Article Card (existing -- refine)
```
Dimensions:  Fluid width, aspect-ratio image + content
Image:       16:9 aspect ratio, rounded-lg top corners
Padding:     20px content area (p-5)
Background:  bg-card (#111114)
Border:      1px solid sws-700/50, hover: sws-600/80
Radius:      8px (rounded-lg)
Shadow:      None at rest
Hover:       translateY(-4px) + border brightens
Tag badge:   Inside content area, mb-3
Title:       font-display, 18px, font-bold, hover: text-accent
Excerpt:     14px, sws-400, line-clamp-2
Meta:        12px, font-mono, sws-500, date + reading time
```

#### Match Card (existing -- refine)
```
Dimensions:  Fluid width, ~120px height
Padding:     16px (p-4)
Background:  bg-card (#111114)
Border:      1px solid, color varies by result:
             W: success/30, D: gold/30, L: red/30, pending: sws-700/50
Radius:      12px (rounded-xl)
Hover:       bg-elevated (#18181C)
Date:        font-mono, 10px, sws-500, uppercase
Result badge: font-mono, 12px, bold, pill with bg tint
Team names:  14px, font-medium, NYRB=sws-white, opponent=sws-400
Scores:      font-mono, 18px, font-bold
xG footer:   font-mono, 10px, sws-500
Entry anim:  opacity 0->1, y 10->0, stagger 30ms
```

#### Player Card (Top Performers)
```
Dimensions:  Fluid width, ~140px height
Padding:     20px (p-5)
Background:  bg-card (#111114)
Border:      1px solid sws-700/50, hover: red/30
Radius:      12px (rounded-xl)
Avatar:      40x40px circle, border sws-700/50
Position:    font-mono, 12px, sws-500, uppercase
Name:        font-display, bold, sws-white, hover: red
Stats row:   font-mono, 12px, sws-400, gap-4
             G+ value: success (positive) or red (negative)
```

#### Chart Container Card (standardized wrapper)
```
Dimensions:  Fluid width, chart height 280px
Padding:     20px (p-5)
Background:  bg-card (#111114)
Border:      1px solid sws-700/50
Radius:      12px (rounded-xl)
Title:       font-display, 18px, font-bold, sws-white
Legend:      font-mono, 12px, inline with title (right-aligned)
             Color swatch: 12x2px rounded bar
Empty state: 280px height, centered mono text, sws-500
```

### 2.2 Navigation

#### Top Navbar (current -- keep and refine)
```
Position:    fixed, top-[2px] (below red accent line)
Height:      64px (h-16)
Background:  transparent -> glass-strong on scroll
Border:      none -> border-b sws-600/50 on scroll
Z-index:     50
Logo:        32x32px rounded square, red bg, "SW" display font
Brand name:  font-display, 18px, font-bold (hidden on mobile)
Links:       font-body, 14px, font-medium, sws-300
             Hover: sws-white + 2px red underline slide
CTA button:  px-4, py-2, bg-red, white, 14px, font-semibold
Mobile:      hamburger icon (3 lines), full-screen overlay
```

#### Data Room Tab Navigation (current -- keep and refine)
```
Type:        Horizontal scrolling pill tabs
Padding:     px-4 py-2 per tab
Background:  Active: bg-red/10, border red/20
             Inactive: transparent, border transparent
Text:        font-mono, 14px
             Active: text-red, font-medium
             Inactive: sws-400, hover: sws-200
Gap:         4px between tabs
Overflow:    overflow-x-auto, scrollbar-hide
```

**Recommended addition:** Mobile bottom navigation bar for the Data Room.
When on any `/data-room/*` route and viewport < 768px, show a fixed bottom
bar with icons for Overview, Matches, Players, Team, League. This prevents
horizontal scrolling of the tab bar on small screens.

```
Position:    fixed bottom-0, z-40
Height:      56px + safe-area-inset-bottom
Background:  glass-strong (bg-bg/90, backdrop-blur-40px)
Border:      border-t sws-700/50
Items:       5 items, flex-1 each, centered icon + 10px label
Active:      text-red, icon filled
Inactive:    text-sws-500, icon outlined
```

### 2.3 Data Tables

#### Standard Table (standings, match logs, season history)
```
Container:   bg-card, border sws-700/50, rounded-xl, overflow-hidden
Header bar:  p-5, border-b sws-700/40
             Title: font-display, 18px, bold, sws-white
             Subtitle: font-mono, 12px, sws-500

Table head:  font-mono, 10px, sws-500, uppercase, tracking-widest
             border-b sws-700/40, py-3
             Alignment: text column left, number columns center

Table rows:  border-b sws-700/20
             Hover: bg-elevated/50
             NYRB highlight: bg-red/5, border-l-2 border-l-red
             py-3, text-sm

Number cells: font-mono, 12px, sws-400 (secondary), sws-300 (primary)
Team name:   font-medium, sws-300, truncate max-w-[160px]
Points:      font-mono, font-bold, sws-white, 14px

Responsive:  Hide secondary columns (P, GD, Form) on mobile
             Use hidden sm:table-cell / hidden md:table-cell
```

#### Sortable Table Enhancement (recommended for Players page)
```
Sortable header: cursor-pointer, hover: sws-300
Active sort:     sws-white + sort arrow indicator (8px SVG)
Sort direction:  triangle-up for ascending, triangle-down for descending
Click behavior:  Toggle asc -> desc -> default
```

### 2.4 Charts and Visualizations

#### Recharts Styling Standards (enforce across all charts)
```css
/* Grid lines */
CartesianGrid:     strokeDasharray="3 3", stroke="#2A2A32", vertical=false

/* Axes */
XAxis tick:        fill="#5D5D6B", fontSize=10, fontFamily=var(--font-jetbrains)
XAxis axisLine:    stroke="#2A2A32"
XAxis tickLine:    false
YAxis tick:        fill="#5D5D6B", fontSize=10, fontFamily=var(--font-jetbrains)
YAxis axisLine:    false
YAxis tickLine:    false

/* Tooltip */
Tooltip bg:        #18181C
Tooltip border:    1px solid #2A2A32
Tooltip radius:    8px
Tooltip font:      JetBrains Mono, 11px
Tooltip label:     #7F7F8B (updated sws-400), 10px
Tooltip values:    #F5F5F7

/* Lines & areas */
Primary stroke:    #ED1A3D, strokeWidth=2
Secondary stroke:  #7F7F8B, strokeWidth=1.5
Tertiary stroke:   #4A6FA5 (slate blue), strokeWidth=1.5
Gradient fills:    Color at 30% opacity -> 0% opacity (top to bottom)

/* Radar charts */
PolarGrid stroke:  #2A2A32
Angle axis tick:   fill="#7F7F8B", fontSize=10
Player fill:       #ED1A3D at 20% opacity
Average fill:      #5D5D6B at 15% opacity (updated sws-500)
```

#### Shot Map Pitch Styling
```
Field background:  #111114
Field lines:       #1E1E24, strokeWidth=1.5
Grid lines:        #1E1E24, strokeWidth=0.3, dashed
Goal:              #2A2A32, 4px height
Penalty spot:      #2A2A32, r=3
Shot circles:      radius = max(5, min(18, xg * 30))
  Goal:            #ED1A3D, 90% opacity, 2px stroke
  Saved:           #7F7F8B, 50% opacity
  Blocked:         #2A2A32, 50% opacity
  Off target:      #5D5D6B, 50% opacity
Animation:         scale 0->1, stagger 80ms
```

#### Chart Color Palette (ordered for multi-series)
```
Series 1 (primary):  #ED1A3D  (red)
Series 2 (secondary): #4A6FA5  (slate blue) -- NEW tertiary
Series 3 (tertiary):  #D4A843  (gold)
Series 4:             #22C55E  (success green)
Series 5:             #8B5CF6  (purple, from tag system)
Series 6:             #F59E0B  (amber warning)
Series 7:             #EC4899  (pink)
Series 8:             #06B6D4  (cyan)
```

### 2.5 Modals, Drawers, Tooltips

#### Tooltip (chart data points)
```
Background:  #18181C (bg-elevated)
Border:      1px solid #2A2A32
Radius:      8px
Padding:     12px 16px
Shadow:      0 10px 25px rgba(0,0,0,0.5)
Max width:   280px
Font:        JetBrains Mono, 11px
Z-index:     50
Animation:   fade-in 150ms
```

#### Modal / Drawer (future: player comparison picker, filter panels)
```
Overlay:     bg-bg/80, backdrop-blur-8px
Container:   bg-card, border sws-700/50, rounded-xl
             Max-width 640px (modal) or 400px (drawer)
Header:      p-6, border-b sws-700/40
             Title: font-display, 20px, bold
             Close: 32x32px button, sws-400, hover sws-white
Body:        p-6
Footer:      p-6, border-t sws-700/40, flex justify-end gap-3
Animation:   Modal: scale 0.95->1 + opacity, 200ms
             Drawer: translateX(100%)->0, 300ms
```

#### Popover (future: metric explanations, tooltips on labels)
```
Background:  #18181C
Border:      1px solid #2A2A32
Radius:      8px
Padding:     12px 16px
Arrow:       6px CSS triangle matching border/bg
Max width:   320px
Shadow:      0 8px 20px rgba(0,0,0,0.4)
```

### 2.6 Form Elements

#### Season Selector (existing -- refine)
```
Type:        <select> with custom chevron SVG
Background:  bg-card (#111114)
Border:      1px solid sws-700/50
Radius:      8px
Padding:     8px 32px 8px 12px
Font:        font-mono, 14px, sws-300
Focus:       border-red/40, outline none
Chevron:     12px SVG, sws-400, right-8px center
```

#### Filter Pill Buttons (match filters)
```
Padding:     12px 12px (px-3 py-1.5)
Radius:      8px (rounded-lg)
Font:        font-mono, 12px
Active:      bg-red/10, text-red, border 1px red/20
Inactive:    text-sws-400, border 1px sws-700/30
Hover:       text-sws-200, border sws-600
Transition:  colors 150ms
Group gap:   4px within group, 12px between groups
```

#### Search Input (recommended addition)
```
Height:      40px
Background:  bg-card (#111114)
Border:      1px solid sws-700/50
Radius:      8px
Padding:     0 12px 0 40px (icon space left)
Font:        font-body, 14px, sws-300
Placeholder: sws-500, italic
Icon:        16px magnifying glass, sws-500, left-12px
Focus:       border-red/40, shadow 0 0 0 3px red/10
Clear btn:   12px X icon, right-12px, sws-500, hover sws-white
```

### 2.7 Badges, Tags, Status Indicators

#### Tag Badge (article categories)
```
Padding:     10px 10px (px-2.5 py-1)
Radius:      full (rounded-full)
Font:        font-mono, 10px, font-bold, uppercase, tracking-widest
Colors:      Per-category color mapping:
  Match Recap:      #ED1A3D
  Preview:          #3B82F6
  Player Spotlight:  #D4A843
  Power Rankings:    #8B5CF6
  Transfer Intel:    #22C55E
  Stat of the Week:  #F59E0B
  Weekly Roundup:    #EC4899
  Default:           #7F7F8B (updated from #6E6E7A)
Background: color at 9% opacity (hex + "18")
Border:     1px solid color at 19% opacity (hex + "30")
```

#### Form Badge (W/D/L dots)
```
Size:        8px circle (w-2 h-2)
Colors:      W=#22C55E, D=#F59E0B, L=#ED1A3D
Usage:       Inline in standings table "Form" column
Gap:         4px between dots
```

#### Result Badge (match cards)
```
Padding:     px-2 py-0.5
Radius:      4px (rounded)
Font:        font-mono, 12px, font-bold
Colors:
  W: bg-success/10, text-success
  D: bg-gold/10, text-gold
  L: bg-red/10, text-red
```

#### Live Indicator
```
Dot:         8px pulsing circle (ping animation)
Color:       #ED1A3D
Label:       font-mono, 10px, uppercase
Animation:   ping keyframe (scale 1->2, opacity 1->0, infinite)
```

---

## 3. Motion & Interaction Design

### Motion Philosophy: "Atmosphere, Not Spectacle"

The current site has strong theatrical motion in the hero (smoke, Three.js,
glow drift) which is appropriate for the landing experience. But data-heavy
pages need restraint. The goal: motion should reveal information progressively,
not distract from it.

### Motion Tiers

**Tier 1 -- Atmospheric (hero only):**
- Three.js particle scene: 60fps, GPU-rendered
- CSS smoke layers: 12-20s drift cycles, low opacity
- Glow drift: 8-10s ease-in-out loops
- Noise/scanline overlays: static (no animation)
- These run ONLY on the homepage hero. No atmospheric effects on inner pages.

**Tier 2 -- Reveal (content sections):**
- `RevealOnScroll`: opacity 0->1, y 20->0, duration 600ms
- Stagger: 50-100ms between sibling elements
- Trigger: `useInView` with `once: true`, margin "-40px" to "-100px"
- Easing: `[0.22, 1, 0.36, 1]` (smooth deceleration)
- Use for: section headers, card groups, chart containers

**Tier 3 -- Data Animation (charts and stats):**
- `AnimatedCounter`: count-up on view, duration 1200ms
- `stat-bar`: CSS width transition, 1200ms, same easing
- Shot map dots: scale 0->1, stagger 80ms
- Table rows: opacity + x-translate, stagger 50ms
- Chart area fills: draw-in from left (Recharts default)
- These animate ONCE on first view, never replay.

**Tier 4 -- Micro-interactions (always active):**
- Hover states: 150ms transitions (colors, borders, shadows)
- Card lift: translateY(-2px) to translateY(-4px) on hover
- Link underline: width 0->100%, 300ms ease-out
- Button press: scale(0.98) on active, 100ms
- Focus ring: 2px solid red, 2px offset, instant
- Filter toggle: color swap, 150ms

### Specific Interaction Patterns

**Card hover (articles):**
```
transform: translateY(-4px)
border-color: sws-600/80
transition: 300ms [0.22, 1, 0.36, 1]
```

**Card hover (match cards):**
```
background: bg-elevated
transition: 150ms ease
// No lift -- data cards should feel grounded
```

**Nav link hover:**
```
color: sws-white (from sws-300)
::after pseudo-element: width 0% -> 100%, 300ms ease-out
  height: 2px, bg-red, bottom: -4px
```

**Page transitions (existing -- simplify):**
Keep the current `PageTransition` component but reduce its complexity:
```
Enter:  opacity 0 -> 1, y 8 -> 0, duration 300ms
Exit:   opacity 1 -> 0, duration 150ms
// Remove any complex clip-path or scale transitions
```

### What to Avoid

- No parallax scrolling on data pages (disorienting with dense content)
- No hover animations on table rows beyond background highlight
- No auto-playing animations that loop (except hero atmospheric)
- No transition delays > 100ms on interactive elements (feels laggy)
- No motion on the custom cursor on data pages (distraction)
- Respect `prefers-reduced-motion`: disable Tier 1-3, keep Tier 4 as instant

### Reduced Motion Implementation
```css
@media (prefers-reduced-motion: reduce) {
  .smoke-layer-1, .smoke-layer-2, .smoke-layer-3,
  .animate-glow-drift, .animate-glow-drift-reverse {
    animation: none !important;
  }

  .stat-bar {
    transition: none !important;
  }

  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Dark Mode Best Practices

### Surface Elevation System (4 levels)

The current system has 3 background levels. Add a 4th for deep overlays
and nested elements within cards:

| Level | Token          | Hex       | Usage                                    |
|-------|----------------|-----------|------------------------------------------|
| 0     | `bg`           | `#0A0A0C` | Page background, deepest layer           |
| 1     | `bg-card`      | `#111114` | Primary cards, table containers          |
| 2     | `bg-elevated`  | `#18181C` | Tooltips, dropdowns, table row hover     |
| 3     | `bg-surface`   | `#1F1F25` | Nested elements inside cards, code blocks|

**NEW: Add `bg-surface` (#1F1F25) to the Tailwind config.**

Rules:
- Never place Level 0 content on a Level 0 background without a border.
- Level 1 cards on Level 0 backgrounds use `border sws-700/50`.
- Level 2 elements inside Level 1 cards use `border sws-700/40`.
- Level 3 is for inline code blocks, nested panels, and deep UI.
- Borders decrease in opacity as surface level increases (50% -> 40% -> 30%).

### Contrast Ratios for Data-Heavy Content

**Measured results from accessibility audit (against #0A0A0C):**

| Color           | Hex       | Ratio | WCAG AA Normal | WCAG AA Large |
|-----------------|-----------|-------|----------------|---------------|
| sws-white       | #F5F5F7   | 18.17 | PASS           | PASS          |
| sws-100         | #E8E8EC   | ~15   | PASS           | PASS          |
| sws-200         | #C8C8D0   | 11.9  | PASS           | PASS          |
| sws-300         | #A0A0AC   | 7.65  | PASS           | PASS          |
| sws-400 (OLD)   | #6E6E7A   | 3.93  | FAIL           | PASS          |
| sws-400 (NEW)   | #7F7F8B   | 5.00  | PASS           | PASS          |
| sws-500 (OLD)   | #44444F   | 2.06  | FAIL           | FAIL          |
| sws-500 (NEW)   | #5D5D6B   | 3.06  | FAIL normal    | PASS          |
| red             | #ED1A3D   | 4.54  | PASS           | PASS          |
| gold            | #D4A843   | 8.93  | PASS           | PASS          |
| slate blue      | #4A6FA5   | 3.87  | FAIL           | PASS          |
| slate blue (NEW)| #557AB2   | 4.53  | PASS           | PASS          |
| success         | #22C55E   | 8.68  | PASS           | PASS          |

**Required token updates (from Brand Guardian + this audit):**
- `sws-400`: `#6E6E7A` -> `#7F7F8B` (ratio 3.93 -> 5.00)
- `sws-500`: `#44444F` -> `#5D5D6B` (ratio 2.06 -> 3.06, use only for large text/decorative)
- Slate blue: `#4A6FA5` -> `#557AB2` (ratio 3.87 -> 4.53)

### Color Hierarchy for Text

| Purpose                    | Token      | Color     | Usage                                  |
|---------------------------|------------|-----------|----------------------------------------|
| Headlines, primary values  | sws-white  | #F5F5F7   | H1-H3, key stats, team names          |
| Body text, secondary values| sws-200    | #C8C8D0   | Article body, table text               |
| Supporting text            | sws-300    | #A0A0AC   | Excerpts, descriptions                 |
| Labels, captions           | sws-400    | #7F7F8B   | Metric labels, axis ticks, timestamps  |
| Decorative text            | sws-500    | #5D5D6B   | Disabled text, watermarks, dividers    |
| Borders, rules             | sws-600    | #2A2A32   | Table borders, section lines           |

### Should There Be a Light Reading Mode?

**Recommendation: No, not at launch.** Reasons:

1. The "Matchday Noir" identity IS the dark theme. A light mode would require
   maintaining a parallel design system that dilutes brand identity.
2. The current dark theme has excellent contrast ratios (after the fixes above).
   Body text (#C8C8D0 on #0A0A0C) achieves 11.9:1, exceeding AAA requirements.
3. Article content already uses generous line height (1.8) and narrow max-width
   (960px), which are the primary readability drivers regardless of color mode.
4. Adding a light mode doubles the testing surface for 30+ data visualization
   components, all of which are tuned for dark backgrounds.

**Future consideration:** If user research indicates demand, implement a
"reading mode" that ONLY applies to `/articles/[slug]` pages -- raising the
article content area to bg-surface (#1F1F25) and increasing body text to
sws-100 (#E8E8EC). This is a lighter-dark, not a full light mode.

---

## 5. Typography System

### Font Stack

| Role     | Font           | Weights    | Usage                           |
|----------|----------------|------------|---------------------------------|
| Display  | Fraunces       | 400,700,900| Headlines, section titles       |
| Body     | Source Sans 3  | 300,400,600,700 | Body text, UI labels       |
| Data     | JetBrains Mono | 400,700    | Stats, tables, timestamps, code |

### Type Scale (with fluid clamp values)

| Token     | Desktop  | Mobile   | CSS                                       | Usage                    |
|-----------|----------|----------|-------------------------------------------|--------------------------|
| `hero`    | 144px    | 64px     | `clamp(4rem, 12vw, 9rem)`                | Homepage hero H1 only    |
| `h1`      | 80px     | 40px     | `clamp(2.5rem, 6vw, 5rem)`               | Page titles              |
| `h2`      | 44px     | 28px     | `clamp(1.75rem, 3.5vw, 2.75rem)`         | Section headers          |
| `h3`      | 28px     | 20px     | `clamp(1.25rem, 2vw, 1.75rem)`           | Card titles, sub-sections|
| `h4`      | 20px     | 18px     | `clamp(1.125rem, 1.5vw, 1.25rem)`        | Component headers        |
| `body`    | 16px     | 16px     | `1rem`                                    | Body text                |
| `body-sm` | 14px     | 14px     | `0.875rem`                                | Secondary text, excerpts |
| `caption` | 12px     | 12px     | `0.75rem`                                 | Labels, metadata         |
| `micro`   | 10px     | 10px     | `0.625rem`                                | Axis labels, fine print  |

### Editorial Typography (Articles)

```css
.article-content {
  font-family: var(--font-source-sans);
  font-size: 1rem;            /* 16px */
  line-height: 1.8;           /* 28.8px -- generous for readability */
  color: #C8C8D0;             /* sws-200 */
  max-width: 960px;           /* ~75 characters per line at 16px */
  font-weight: 400;
}

.article-content h2 {
  font-family: var(--font-fraunces);
  font-size: 1.5rem;          /* 24px */
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #F5F5F7;             /* sws-white */
  margin-top: 3rem;           /* 48px */
  margin-bottom: 1rem;        /* 16px */
}

.article-content h3 {
  font-family: var(--font-fraunces);
  font-size: 1.25rem;         /* 20px */
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: #F5F5F7;
  margin-top: 2rem;           /* 32px */
  margin-bottom: 0.75rem;     /* 12px */
}

.article-content p {
  margin-bottom: 1.5rem;      /* 24px */
}

.article-content blockquote {
  border-left: 2px solid #ED1A3D;
  padding-left: 1.5rem;       /* 24px */
  margin: 2rem 0;             /* 32px */
  font-style: italic;
  color: #A0A0AC;             /* sws-300 */
}
```

### Data Typography (Stats, Tables, Charts)

```css
/* Table header cells */
.data-th {
  font-family: var(--font-jetbrains);
  font-size: 10px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.15em;     /* tracking-widest */
  color: #7F7F8B;             /* updated sws-400 */
}

/* Table data cells -- primary */
.data-td-primary {
  font-family: var(--font-jetbrains);
  font-size: 12px;
  font-weight: 400;
  color: #A0A0AC;             /* sws-300 */
  /* For key values like points, goals: */
  /* font-weight: 700; color: #F5F5F7; */
}

/* Stat values (metric cards, hero stats) */
.stat-value {
  font-family: var(--font-source-sans);
  font-size: 30px;            /* text-3xl */
  font-weight: 700;
  color: #F5F5F7;
  letter-spacing: -0.01em;
  /* For mono stats: font-family: var(--font-jetbrains); */
}

/* Metric labels */
.stat-label {
  font-family: var(--font-jetbrains);
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #7F7F8B;             /* updated sws-400 */
}

/* Chart axis labels */
.chart-axis {
  font-family: var(--font-jetbrains);
  font-size: 10px;
  fill: #5D5D6B;              /* updated sws-500 */
}

/* Chart tooltip labels */
.chart-tooltip-label {
  font-family: var(--font-jetbrains);
  font-size: 10px;
  color: #7F7F8B;
}

/* Chart tooltip values */
.chart-tooltip-value {
  font-family: var(--font-jetbrains);
  font-size: 11px;
  color: #F5F5F7;
}
```

### Line Height Rules

| Content Type        | Line Height | Rationale                           |
|--------------------|-------------|-------------------------------------|
| Display headlines  | 0.95 - 1.1  | Tight for visual impact            |
| Section headers    | 1.1 - 1.2   | Compact but readable               |
| Card titles        | 1.2 - 1.3   | Balance density and clarity        |
| Body text          | 1.7 - 1.8   | Generous for sustained reading     |
| Data labels/mono   | 1.4 - 1.5   | Tighter for tabular density        |
| Table cells        | 1.0 (via py) | Line height from row padding       |

### Max Line Width

| Context            | Max Width   | Characters (~) |
|-------------------|-------------|----------------|
| Article body      | 960px       | ~75 chars      |
| Card descriptions | Card width  | ~45-55 chars   |
| Data table cells  | Cell width  | Truncate with ellipsis |
| Hero subtitle     | 448px (max-w-md) | ~50 chars |

---

## 6. Responsive Strategy

### Breakpoint System

```
Mobile:       < 640px    (default / base styles)
Tablet:       >= 640px   (sm:)
Desktop:      >= 768px   (md:)
Large Desktop: >= 1024px (lg:)
XL Desktop:   >= 1280px  (xl:) -- container max-width kicks in
```

### Mobile-First Data Patterns

#### Data Tables on Mobile

**Problem:** Complex tables (8+ columns) don't fit on 375px screens.

**Solution 1 -- Progressive Column Hiding:**
```
Always visible:  Team/Player name, key stat (Points/Goals)
sm: (640px+):    Add secondary stats (GP, GD)
md: (768px+):    Add all stats
lg: (1024px+):   Add form column

Classes: hidden sm:table-cell, hidden md:table-cell
```

**Solution 2 -- Card Transformation (for player stats table):**
On mobile, transform each table row into a horizontal card:
```
<div class="sm:hidden">
  <!-- Each player becomes a card -->
  <div class="flex justify-between items-center p-4 border-b border-sws-700/20">
    <div>
      <p class="font-medium text-sws-white text-sm">{name}</p>
      <p class="text-xs font-mono text-sws-500">{position}</p>
    </div>
    <div class="flex gap-3 text-xs font-mono">
      <span>{goals}G</span>
      <span>{assists}A</span>
      <span>{xg} xG</span>
    </div>
  </div>
</div>
<table class="hidden sm:table">
  <!-- Standard table for larger screens -->
</table>
```

#### Charts on Mobile

**Line/Area Charts (xG Race, Points Trajectory, Season Progression):**
- Reduce height from 280px to 200px on mobile
- Simplify axis labels (e.g., "MW1" instead of "Matchweek 1")
- Remove secondary grid lines
- Increase touch target for tooltips (use `activeDot={{ r: 8 }}`)
- Consider horizontal scroll for charts with many data points

```jsx
<div className="h-[200px] sm:h-[280px]">
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```

**Radar Charts (Player Radar):**
- Reduce height from 300px to 240px
- Reduce outerRadius from 75% to 65%
- Abbreviate stat labels on mobile ("Pass Comp." -> "Pass%")

**Shot Maps:**
- Maintain aspect ratio (paddingBottom: 70%)
- Increase minimum shot circle radius from 5 to 7 for touch targets
- Add horizontal scroll hint if map exceeds viewport

#### Metric Cards on Mobile

Current: 2-col on mobile, 3-col tablet, 6-col desktop. This works well.

**Refinement:** On very small screens (< 375px), collapse to 1 column with
horizontal layout (label left, value right) to avoid cramped 2-col:

```
@media (max-width: 374px) {
  .metric-card { flex-direction: row; justify-content: space-between; }
}
```

#### Match Cards on Mobile

Current: 1-col mobile, 2-col tablet, 3-col desktop. This is correct.
No changes needed.

### Touch-Friendly Interactions

| Element             | Min Touch Target | Current | Action Needed      |
|--------------------|-----------------|---------|-------------------|
| Nav links          | 44px            | ~32px   | Increase padding   |
| Filter pills       | 44px            | ~28px   | Increase to py-2.5 |
| Table rows (links) | 44px            | ~40px   | Increase row py    |
| Season selector    | 44px            | ~36px   | Increase height    |
| Hamburger menu     | 44px            | 40px    | Acceptable         |
| Chart data points  | 44px            | 5-18px  | activeDot r=8      |

### Responsive Image Strategy

```
Article hero:    Sizes="(max-width: 640px) 100vw, (max-width: 1280px) 60vw, 768px"
Article card:    Sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
Team logos:      Fixed 16x16 or 20x20, no responsive sizing needed
Player avatars:  Fixed 40x40 (cards) or 80x80 (profiles)
```

---

## 7. Signature Visual Elements

### Current Elements -- Assessment

| Element           | Keep? | Rationale                                        |
|-------------------|-------|--------------------------------------------------|
| Smoke effects     | YES   | Hero only. Defines the "matchday atmosphere"     |
| Grid pattern      | YES   | Subtle, adds depth without distraction           |
| Scanlines         | REDUCE| Dial down opacity from 0.4 to 0.2, hero only    |
| Noise overlay     | YES   | Adds film grain texture, very subtle             |
| Glass morphism    | YES   | Navbar + mobile menu. Don't extend further.      |
| Glow effects      | REFINE| Keep for NYRB win highlight, remove ambient glow |
| Red accent line   | YES   | Top of page, iconic, brand identifier            |
| Vertical stripe   | YES   | Hero only, evokes scarf/tifo                     |
| Custom cursor     | REMOVE| Adds no value, hinders usability, performance   |
| Three.js scene    | YES   | Hero only, with HeroFallback for performance     |
| Section dividers  | YES   | Red gradient bleed from left margin              |

### New Signature Elements

#### 1. "The Wire" -- Animated Connection Lines

A subtle design element for the data room: thin animated lines that connect
related data points, like a tactical board. Used sparingly between metric
cards and their source charts.

```css
.wire {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(237, 26, 61, 0.15) 20%,
    rgba(237, 26, 61, 0.15) 80%,
    transparent 100%
  );
  /* Animated dash pattern */
  background-size: 200% 1px;
  animation: wire-flow 3s linear infinite;
}

@keyframes wire-flow {
  0% { background-position: 200% 0; }
  100% { background-position: 0 0; }
}
```

#### 2. "Terrace Numbers" -- Oversized Background Stats

Large, semi-transparent stat numbers rendered behind content sections,
evoking jersey numbers on the terrace:

```css
.terrace-number {
  position: absolute;
  font-family: var(--font-fraunces);
  font-weight: 900;
  font-size: clamp(8rem, 20vw, 16rem);
  color: rgba(237, 26, 61, 0.03);
  line-height: 0.8;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
```

Use case: On the player profile page, render the player's shirt number as
a massive background element behind the header card.

#### 3. "Signal Pulse" -- Data Update Indicator

When live data refreshes (standings, scores), a brief red pulse ripples
outward from the updated element:

```css
.signal-pulse {
  position: relative;
}

.signal-pulse::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 1px solid rgba(237, 26, 61, 0.4);
  border-radius: inherit;
  animation: signal-pulse 1s ease-out forwards;
  pointer-events: none;
}

@keyframes signal-pulse {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.05); }
}
```

#### 4. "Redline" -- Accent Gradient Separator

An evolution of the existing `section-line`. A 3px gradient line with a glow
that appears between major content sections. More refined than a full-width
border:

```css
.redline {
  height: 3px;
  background: linear-gradient(90deg,
    #ED1A3D 0%,
    rgba(237, 26, 61, 0.4) 40%,
    rgba(237, 26, 61, 0.1) 70%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(237, 26, 61, 0.15);
  max-width: 200px;
}
```

#### 5. "Matchday Score Flash" -- Result Color Coding

On match detail pages, when NYRB wins, the score header card gets a subtle
red border glow. This is already partially implemented (`glow-red` class).
Standardize it:

```
Win:   glow-red (existing) + border-success/20
Draw:  No glow + border-gold/20
Loss:  No glow + border-red/20 (subtle, not triumphant)
```

#### 6. Corner Crop Marks

Registration/crop marks in section corners, evoking print media and
broadcast graphics. Very subtle, decorative only:

```css
.crop-marks {
  position: relative;
}

.crop-marks::before,
.crop-marks::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(237, 26, 61, 0.12);
  border-style: solid;
  pointer-events: none;
}

.crop-marks::before {
  top: 0; left: 0;
  border-width: 1px 0 0 1px;
}

.crop-marks::after {
  bottom: 0; right: 0;
  border-width: 0 1px 1px 0;
}
```

Use case: Section headers on the homepage, data room card containers.

### Elements to Remove or Reduce

1. **Custom cursor** -- Remove entirely. It provides no brand value, interferes
   with accessibility (users expect system cursors), and consumes JS runtime.
   Custom cursors are a 2020-era portfolio trend, not appropriate for a data tool.

2. **Scanline opacity** -- Reduce from 0.4 to 0.15. Currently visible enough to
   interfere with chart readability if applied globally. Restrict to hero only.

3. **MagneticButton** -- Reduce magnet radius. The current magnetic hover is fun
   but disorienting on buttons the user needs to click quickly (like "Subscribe").
   Limit to the hero CTA only.

4. **GlitchText** -- Use extremely sparingly. Good for a "live" match indicator
   or error states. Not for regular content.

---

## 8. Accessibility Audit & Fixes

### Critical Fixes Required

#### Fix 1: sws-400 Color Token
```
OLD: #6E6E7A (contrast 3.93:1 on #0A0A0C) -- FAILS AA normal text
NEW: #7F7F8B (contrast 5.00:1 on #0A0A0C) -- PASSES AA normal text
```
**Impact:** This color is used extensively for metric labels, timestamps,
section labels, chart axis ticks, and table header cells. Every instance
in the codebase must be updated.

Files affected:
- `tailwind.config.ts` (token definition)
- `packages/shared/src/brand.ts` (brand constants)
- All Recharts tick fill values (hardcoded as `#6E6E7A`)
- `PlayerRadar.tsx` PolarAngleAxis tick
- `ShotMap.tsx` outcomeColor.saved
- `TagBadge.tsx` default color

#### Fix 2: sws-500 Color Token
```
OLD: #44444F (contrast 2.06:1 on #0A0A0C) -- FAILS both AA levels
NEW: #5D5D6B (contrast 3.06:1 on #0A0A0C) -- PASSES AA large text only
```
**Usage rule:** sws-500 must ONLY be used for:
- Large text (18px+ or 14px+ bold) -- WCAG "large text" threshold
- Decorative elements (borders, icons, non-text indicators)
- NEVER for small body text that conveys meaning

Files affected:
- `tailwind.config.ts`
- `packages/shared/src/brand.ts`
- All Recharts axis label fills (currently #44444F)

#### Fix 3: Slate Blue Tertiary Color
```
OLD: #4A6FA5 (contrast 3.87:1 on #0A0A0C) -- FAILS AA normal text
NEW: #557AB2 (contrast 4.53:1 on #0A0A0C) -- PASSES AA normal text
```
**Impact:** This is a new color from Brand Guardian. Register it in the
Tailwind config as `slate` and use the accessible version from the start.

#### Fix 4: Red on Card Backgrounds
```
#ED1A3D on #111114 (bg-card) = 4.32:1 -- FAILS AA normal text (needs 4.5)
#EE294A on #111114 = 4.53:1 -- PASSES
```
**Action:** When red text appears on bg-card surfaces (common in section
labels, tag badges, active tab text), use `#EE294A` or ensure the red text
is 14px bold or larger (qualifies as "large text" at 3:1).

**Practical approach:** Since the difference between #ED1A3D and #EE294A is
imperceptible, keep #ED1A3D as the brand red but ensure all red text on
card backgrounds is at minimum 14px bold (which it currently is in most cases).
Audit the edge cases where 10px or 12px red text appears on bg-card.

#### Fix 5: Touch Target Sizes
See the table in Section 6. Key fixes:
- Filter pills: increase from py-1.5 to py-2.5 (28px -> 40px+)
- Season selector: add min-height 44px
- Data Room tab nav links: increase from py-2 to py-2.5

#### Fix 6: Focus Indicators
The current system has focus styles on buttons (`focus:outline-none
focus:border-red/40`) but many interactive elements lack visible focus
indicators. Add a global focus-visible style:

```css
@layer base {
  :focus-visible {
    outline: 2px solid #ED1A3D;
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Remove the default outline only when focus-visible handles it */
  :focus:not(:focus-visible) {
    outline: none;
  }
}
```

#### Fix 7: ARIA Labels
- Hamburger menu button: Has `aria-label="Toggle menu"` -- GOOD
- Season selector: Add `aria-label="Select season"`
- Filter pills: Add `role="radiogroup"` on container, `role="radio"`
  and `aria-checked` on each pill
- Data room tabs: Add `role="tablist"` on nav, `role="tab"` on each link
- Form badges (W/D/L dots): Have `title` attribute -- GOOD but add
  `aria-label` for screen readers

---

## 9. Revised Design Tokens

### Complete Tailwind Config Update

```typescript
// tailwind.config.ts -- PROPOSED UPDATE
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0C',
          card: '#111114',
          elevated: '#18181C',
          surface: '#1F1F25',    // NEW: Level 3 surface
        },
        red: {
          DEFAULT: '#ED1A3D',
          glow: 'rgba(237, 26, 61, 0.15)',
          muted: 'rgba(237, 26, 61, 0.6)',
        },
        accent: '#FF4D6A',
        gold: '#D4A843',
        slate: {                 // NEW: tertiary color system
          DEFAULT: '#557AB2',    // accessible version
          glow: 'rgba(85, 122, 178, 0.15)',
          muted: 'rgba(85, 122, 178, 0.6)',
        },
        sws: {
          white: '#F5F5F7',
          100: '#E8E8EC',
          200: '#C8C8D0',
          300: '#A0A0AC',
          400: '#7F7F8B',        // UPDATED from #6E6E7A
          500: '#5D5D6B',        // UPDATED from #44444F
          600: '#2A2A32',
          700: '#1E1E24',
        },
        success: '#22C55E',
        warning: '#F59E0B',      // ADD: was only in brand.ts
        info: '#3B82F6',         // ADD: was only in brand.ts
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-source-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      maxWidth: {
        container: '1280px',
        narrow: '960px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'line-draw': 'line-draw 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'counter-up': 'counter-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'signal-pulse': 'signal-pulse 1s ease-out forwards',  // NEW
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'line-draw': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'signal-pulse': {  // NEW
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.05)' },
        },
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #ED1A3D 0%, #FF4D6A 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0C 0%, #111114 100%)',
        'slate-gradient': 'linear-gradient(135deg, #557AB2 0%, #4A6FA5 100%)', // NEW
      },
    },
  },
  plugins: [],
};
```

### Updated Brand Constants

```typescript
// packages/shared/src/brand.ts -- PROPOSED UPDATE
export const brand = {
  name: 'South Ward Signal',
  tagline: 'Data-driven. Supporter-born.',
  description: 'Independent, AI-powered coverage of the New York Red Bulls.',

  colors: {
    bg: '#0A0A0C',
    bgCard: '#111114',
    bgElevated: '#18181C',
    bgSurface: '#1F1F25',       // NEW
    red: '#ED1A3D',
    redGlow: 'rgba(237, 26, 61, 0.15)',
    redMuted: 'rgba(237, 26, 61, 0.6)',
    accent: '#FF4D6A',
    gold: '#D4A843',
    slate: '#557AB2',           // NEW (accessible version)
    white: '#F5F5F7',
    gray: {
      100: '#E8E8EC',
      200: '#C8C8D0',
      300: '#A0A0AC',
      400: '#7F7F8B',           // UPDATED
      500: '#5D5D6B',           // UPDATED
      600: '#2A2A32',
      700: '#1E1E24',
    },
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  fonts: {
    display: "'Fraunces', serif",
    body: "'Source Sans 3', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  fontWeights: {
    displayBlack: 900,
    displayBold: 700,
    bodyRegular: 400,
    bodyLight: 300,
    bodySemibold: 600,          // ADD
    monoRegular: 400,
    monoBold: 700,
  },

  spacing: {
    section: '120px',
    sectionMobile: '80px',
    container: '1280px',
    containerNarrow: '960px',
  },

  animation: {
    duration: {
      fast: 0.15,               // UPDATED from 0.2
      normal: 0.3,              // UPDATED from 0.4
      slow: 0.6,                // UPDATED from 0.8
      reveal: 1.0,              // UPDATED from 1.2
    },
    easing: {
      smooth: [0.22, 1, 0.36, 1],
      bounce: [0.68, -0.55, 0.265, 1.55],
      snap: [0.77, 0, 0.175, 1],
    },
  },

  // NEW: Chart color palette for multi-series visualizations
  chartColors: [
    '#ED1A3D',  // red (primary)
    '#557AB2',  // slate blue (secondary)
    '#D4A843',  // gold (tertiary)
    '#22C55E',  // success green
    '#8B5CF6',  // purple
    '#F59E0B',  // amber
    '#EC4899',  // pink
    '#06B6D4',  // cyan
  ],
} as const;
```

### CSS Custom Properties (for non-Tailwind usage)

Add to `globals.css` for use in Recharts and other direct CSS contexts:

```css
@layer base {
  :root {
    /* Surface hierarchy */
    --color-bg: #0A0A0C;
    --color-bg-card: #111114;
    --color-bg-elevated: #18181C;
    --color-bg-surface: #1F1F25;

    /* Brand colors */
    --color-red: #ED1A3D;
    --color-accent: #FF4D6A;
    --color-gold: #D4A843;
    --color-slate: #557AB2;

    /* Text hierarchy */
    --color-text-primary: #F5F5F7;
    --color-text-secondary: #C8C8D0;
    --color-text-tertiary: #A0A0AC;
    --color-text-muted: #7F7F8B;
    --color-text-disabled: #5D5D6B;

    /* Borders */
    --color-border-default: #1E1E24;
    --color-border-subtle: #2A2A32;

    /* Semantic */
    --color-success: #22C55E;
    --color-warning: #F59E0B;
    --color-error: #ED1A3D;
    --color-info: #3B82F6;

    /* Spacing scale */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;
    --space-20: 80px;
    --space-24: 96px;
    --space-32: 128px;

    /* Radii */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;

    /* Shadows (dark mode specific) */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);
    --shadow-glow-red: 0 0 40px rgba(237, 26, 61, 0.15), 0 0 80px rgba(237, 26, 61, 0.05);

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 600ms ease;
    --easing-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  }
}
```

---

## Implementation Priority

### Phase 1 -- Accessibility Fixes (immediate)
1. Update sws-400 token from #6E6E7A to #7F7F8B
2. Update sws-500 token from #44444F to #5D5D6B
3. Add slate color (#557AB2) to Tailwind config
4. Add bg-surface (#1F1F25) to Tailwind config
5. Update all hardcoded color values in Recharts components
6. Add global `:focus-visible` styles
7. Increase touch target sizes on filter pills and selectors
8. Add ARIA attributes to tabs, filters, and selectors
9. Add `prefers-reduced-motion` media query

### Phase 2 -- Component Refinements (1-2 weeks)
1. Standardize chart container card component
2. Add CSS custom properties to globals.css
3. Implement mobile bottom nav for Data Room
4. Add reading progress bar to article pages
5. Add sticky match header to match detail pages
6. Implement card-to-table transformation for mobile player stats
7. Remove custom cursor component

### Phase 3 -- Signature Elements (2-4 weeks)
1. Add "Terrace Numbers" background effect to player profiles
2. Add "Redline" gradient separators
3. Add "Crop Marks" decorative corners
4. Add "Signal Pulse" for live data updates
5. Reduce scanline opacity to 0.15
6. Implement "The Wire" connection lines in data room

### Phase 4 -- Polish (ongoing)
1. Responsive chart height adjustments
2. Sortable table headers with visual indicators
3. Search input component
4. Modal/drawer component system
5. Popover component for metric explanations
6. Animation performance audit (reduce Framer Motion bundle)

---

## Quick Reference -- Color Cheat Sheet

```
BACKGROUNDS          TEXT ON #0A0A0C      TEXT ON #111114      ACCENTS
#0A0A0C (bg)         #F5F5F7 (18.2:1)    #F5F5F7 (17.3:1)    #ED1A3D (4.5:1)
#111114 (card)       #C8C8D0 (11.9:1)    #C8C8D0 (11.3:1)    #D4A843 (8.9:1)
#18181C (elevated)   #A0A0AC (7.7:1)     #A0A0AC (7.2:1)     #557AB2 (4.5:1)
#1F1F25 (surface)    #7F7F8B (5.0:1)     #7F7F8B (4.8:1)     #22C55E (8.7:1)
#2A2A32 (border)     #5D5D6B (3.1:1)*    #5D5D6B (2.9:1)*    #F59E0B (9.1:1)

* sws-500 only for large text (18px+) or decorative use
```

---

*End of UI Design System document. This specification provides the complete
design foundation for the "Matchday Noir" visual direction of South Ward Signal.*
