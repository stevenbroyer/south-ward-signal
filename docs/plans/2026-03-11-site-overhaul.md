# South Ward Signal — Site Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete site overhaul — new design system, tech stack upgrade, richer content features, community layer, social feeds, and accessibility fixes.

**Architecture:** Phased approach across 6 phases. Phase 1 upgrades the foundation (Next.js 16, design tokens, shadcn/ui). Phase 2 rebuilds the core layout. Phase 3 overhauls the homepage with social feeds. Phase 4 enriches the content system. Phase 5 upgrades the Data Room. Phase 6 adds community features.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3.4+, shadcn/ui + Radix, motion (ex framer-motion) + LazyMotion, TanStack Query v5, Recharts + custom SVG, Supabase (typed + Realtime), Ghost CMS (webhooks), Vitest + Playwright, Zod.

**Design Brief:** `docs/plans/2026-03-11-site-overhaul-design.md`
**Agent Reports:** `BRAND_STRATEGY_BRIEF.md`, `TREND-RESEARCH-REPORT.md`, `UX-RESEARCH-REPORT.md`, `docs/CONTENT_STRATEGY.md`, `docs/UI_DESIGN_SYSTEM.md`

---

## Phase 1: Foundation (Tech Stack + Design Tokens)

### Task 1.1: Upgrade Next.js 14 → 16 + React 19

**Files:**
- Modify: `apps/web/package.json`
- Modify: `package.json` (root)
- Modify: `apps/web/next.config.mjs`

**Step 1: Update dependencies**

In `apps/web/package.json`, update:
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

**Step 2: Run install**

Run: `cd "apps/web" && npm install`

**Step 3: Update next.config.mjs for Next.js 16**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sws/shared'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.ghost.io' },
      { protocol: 'https', hostname: '**.ghost.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.sofascore.com' },
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'tmssl.akamaized.net' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['motion', 'recharts', 'date-fns'],
    viewTransition: true,
  },
};

export default nextConfig;
```

**Step 4: Fix async request API changes**

In `apps/web/app/layout.tsx`, `headers()` returns a Promise in Next.js 16 — it already uses `await headers()` so this is fine. Check all other files using `headers()`, `cookies()`, `searchParams`, or `params` to ensure they `await`.

Key files to check and update:
- `apps/web/app/data-room/page.tsx` — `searchParams` is now a Promise
- `apps/web/app/data-room/matches/page.tsx` — same
- `apps/web/app/data-room/players/page.tsx` — same
- `apps/web/app/data-room/league/page.tsx` — same
- `apps/web/app/data-room/team/page.tsx` — same
- `apps/web/app/data-room/matches/[matchId]/page.tsx` — `params` is now a Promise
- `apps/web/app/data-room/players/[name]/page.tsx` — same
- `apps/web/app/articles/[slug]/page.tsx` — same

For each, change:
```typescript
// Before (Next.js 14)
export default async function Page({ searchParams }: { searchParams: { season?: string } }) {
  const season = searchParams.season || '2025';

// After (Next.js 16)
export default async function Page({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season: seasonParam } = await searchParams;
  const season = seasonParam || '2025';
```

And for params:
```typescript
// Before
export default async function Page({ params }: { params: { matchId: string } }) {
  const { matchId } = params;

// After
export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
```

**Step 5: Verify build**

Run: `cd "apps/web" && npx next build`
Expected: Build succeeds (warnings OK, errors must be fixed)

**Step 6: Commit**

```bash
git add apps/web/package.json apps/web/next.config.mjs apps/web/app/
git commit -m "chore: upgrade Next.js 14 → 16, React 18 → 19

Enables React Compiler, View Transitions API, Turbopack default.
Updates all async request APIs (searchParams, params, headers).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.2: Remove GSAP + Lenis, Migrate framer-motion → motion

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/components/layout/SmoothScroll.tsx` → DELETE
- Modify: `apps/web/components/ui/Cursor.tsx` → DELETE
- Modify: `apps/web/components/ui/PageTransition.tsx` → DELETE
- Modify: All files importing `framer-motion`

**Step 1: Swap packages**

In `apps/web/package.json`:
- Remove: `"framer-motion"`, `"gsap"`, `"lenis"`
- Add: `"motion": "^12.0.0"`

Run: `cd "apps/web" && npm install`

**Step 2: Find and replace all framer-motion imports**

Search all `.tsx` and `.ts` files for `from 'framer-motion'` and replace with `from 'motion/react'`.

Key files (grep for exact list):
- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `components/hero/Hero.tsx`
- `components/hero/HeroStats.tsx`
- `components/ui/RevealOnScroll.tsx`
- `components/ui/MagneticButton.tsx`
- `components/ui/TextReveal.tsx`
- `components/ui/ParallaxImage.tsx`
- `components/data/*.tsx` (multiple)
- `app/sections/*.tsx`
- `app/articles/ArticlesPageClient.tsx`
- `app/data-room/OverviewClient.tsx`

**Step 3: Delete SmoothScroll, CustomCursor, PageTransition**

Delete these files:
- `apps/web/components/layout/SmoothScroll.tsx`
- `apps/web/components/ui/Cursor.tsx`
- `apps/web/components/ui/PageTransition.tsx`

**Step 4: Update root layout**

Replace `apps/web/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { fraunces, sourceSans, jetbrainsMono } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://southwardsignal.com'),
  title: {
    default: 'South Ward Signal — NY Red Bulls Coverage',
    template: '%s | South Ward Signal',
  },
  description: 'Independent, data-driven coverage of the New York Red Bulls. Match recaps, tactical breakdowns, and advanced analytics — powered by AI, born from the supporters section.',
  keywords: ['New York Red Bulls', 'NYRB', 'MLS', 'Red Bull Arena', 'soccer analytics', 'xG', 'match recap'],
  authors: [{ name: 'South Ward Signal' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://southwardsignal.com',
    siteName: 'South Ward Signal',
    title: 'South Ward Signal — NY Red Bulls Coverage',
    description: 'Independent, data-driven coverage of the New York Red Bulls.',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@SouthWardSignal',
    creator: '@SouthWardSignal',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0C',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-next-url') ?? '';
  const isAdmin = pathname.startsWith('/admin');

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body className="bg-bg text-sws-white font-body antialiased">
        {isAdmin ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-red focus:text-white focus:rounded">
              Skip to content
            </a>
            <Navbar />
            <main id="main-content" className="min-h-screen">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
```

**Step 5: Remove Lenis CSS from globals.css**

Delete lines 292-309 (the Lenis section) from `apps/web/styles/globals.css`.

**Step 6: Verify build**

Run: `cd "apps/web" && npx next build`

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove GSAP/Lenis/Cursor, migrate framer-motion → motion

- Removes ~68KB gzipped from client bundle
- Removes SmoothScroll wrapper (native scroll)
- Removes CustomCursor (accessibility concern)
- Removes PageTransition (View Transitions API replaces it)
- Adds skip-to-content link for accessibility

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.3: Update Tailwind Design Tokens (Colors + Accessibility)

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/styles/globals.css`
- Modify: `packages/shared/src/brand.ts`

**Step 1: Update tailwind.config.ts**

Replace the `colors` section with the refined Matchday Noir palette:

```typescript
colors: {
  bg: {
    DEFAULT: '#0A0A0C',
    card: '#111114',
    elevated: '#18181C',
    surface: '#1F1F25',
  },
  red: {
    DEFAULT: '#ED1A3D',
    glow: 'rgba(237, 26, 61, 0.15)',
    muted: 'rgba(237, 26, 61, 0.6)',
  },
  accent: '#FF4D6A',
  gold: '#D4A843',
  blue: {
    DEFAULT: '#557AB2',
    muted: 'rgba(85, 122, 178, 0.15)',
  },
  sws: {
    white: '#F5F5F7',
    100: '#E8E8EC',
    200: '#C8C8D0',
    300: '#A0A0AC',
    400: '#7F7F8B',  // Fixed from #6E6E7A — WCAG AA compliant (5.00:1)
    500: '#5D5D6B',  // Fixed from #44444F — large text only (3.06:1)
    600: '#2A2A32',
    700: '#1E1E24',
  },
  success: '#22C55E',
  warning: '#F59E0B',
},
```

**Step 2: Update globals.css for accessibility**

Replace the `p` color and the footer `text-sws-500` references throughout — these will naturally use the updated tokens.

Also add `prefers-reduced-motion` support:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Step 3: Update brand.ts**

Update `packages/shared/src/brand.ts` to include the tertiary blue and fixed grays:
```typescript
export const BRAND_COLORS = {
  red: '#ED1A3D',
  redLight: '#FF4D6A',
  gold: '#D4A843',
  blue: '#557AB2',
  bgPrimary: '#0A0A0C',
  bgCard: '#111114',
  bgElevated: '#18181C',
  bgSurface: '#1F1F25',
  textPrimary: '#F5F5F7',
  textSecondary: '#C8C8D0',
  textTertiary: '#7F7F8B',
} as const;
```

**Step 4: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/styles/globals.css packages/shared/src/brand.ts
git commit -m "fix: update design tokens for WCAG AA compliance

- sws-400: #6E6E7A → #7F7F8B (3.93:1 → 5.00:1)
- sws-500: #44444F → #5D5D6B (large text compliant)
- Add Slate Blue (#557AB2) as tertiary data color
- Add 4th surface elevation (#1F1F25)
- Add prefers-reduced-motion support

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.4: Initialize shadcn/ui

**Files:**
- Create: `apps/web/components/ui/button.tsx` (auto-generated)
- Create: `apps/web/lib/utils.ts` (may need update)
- Create: `apps/web/components.json`

**Step 1: Initialize shadcn**

Run:
```bash
cd "apps/web" && npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate (we'll override with our tokens)
- CSS variables: Yes
- Tailwind config: `tailwind.config.ts`
- Components alias: `@/components`
- Utils alias: `@/lib/utils`

**Step 2: Install initial components**

```bash
cd "apps/web" && npx shadcn@latest add button dialog dropdown-menu select tabs tooltip sheet card badge table
```

**Step 3: Override shadcn CSS variables**

In `globals.css`, add our custom CSS variables for shadcn to use our Matchday Noir palette. Add after the `@tailwind` directives:

```css
@layer base {
  :root {
    --background: 240 10% 4%;      /* #0A0A0C */
    --foreground: 240 7% 97%;      /* #F5F5F7 */
    --card: 240 8% 7%;             /* #111114 */
    --card-foreground: 240 7% 97%;
    --popover: 240 8% 10%;         /* #18181C */
    --popover-foreground: 240 7% 97%;
    --primary: 350 86% 52%;        /* #ED1A3D */
    --primary-foreground: 0 0% 100%;
    --secondary: 39 55% 55%;       /* #D4A843 */
    --secondary-foreground: 0 0% 100%;
    --muted: 240 6% 15%;           /* #1F1F25 */
    --muted-foreground: 240 5% 52%;/* #7F7F8B */
    --accent: 348 100% 65%;        /* #FF4D6A */
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 6% 18%;          /* #2A2A32 */
    --input: 240 6% 18%;
    --ring: 350 86% 52%;           /* #ED1A3D */
    --radius: 0.5rem;
  }
}
```

**Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: initialize shadcn/ui with Matchday Noir theme

Adds Button, Dialog, DropdownMenu, Select, Tabs, Tooltip, Sheet,
Card, Badge, Table components with custom CSS variables.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.5: Generate Supabase Types + Add TanStack Query

**Files:**
- Create: `apps/web/types/database.ts`
- Modify: `apps/web/lib/supabase.ts`
- Modify: `apps/web/package.json`
- Create: `apps/web/lib/query-client.tsx`

**Step 1: Add dependencies**

```bash
cd "apps/web" && npm install @tanstack/react-query zod
```

**Step 2: Generate Supabase types**

If Supabase CLI is available:
```bash
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > apps/web/types/database.ts
```

If not available, create a manual types file based on the schema from the migrations. The key tables are: `matches`, `standings`, `player_stats`, `shots`, `events`, `lineups`, `goals_added`.

**Step 3: Type the Supabase client**

Update `apps/web/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = isConfigured
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : (null as unknown as ReturnType<typeof createClient<Database>>);
```

**Step 4: Create TanStack Query provider**

Create `apps/web/lib/query-client.tsx`:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Step 5: Wrap layout with QueryProvider**

In `apps/web/app/layout.tsx`, import `QueryProvider` and wrap the non-admin content:
```tsx
import { QueryProvider } from '@/lib/query-client';
// ...
<QueryProvider>
  <Navbar />
  <main id="main-content" className="min-h-screen">{children}</main>
  <Footer />
</QueryProvider>
```

**Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat: add Supabase types, TanStack Query, Zod

- Generated Supabase types for full type safety
- QueryProvider wraps app for client-side data caching
- Zod added for Ghost API response validation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.6: Ghost Webhook Revalidation

**Files:**
- Modify: `apps/web/lib/ghost.ts`
- Modify: `apps/web/app/api/revalidate/route.ts`

**Step 1: Update ghost.ts to use fetch with cache tags**

Replace `apps/web/lib/ghost.ts`:
```typescript
import type { GhostPost } from '@sws/shared';
import { z } from 'zod';

const GHOST_URL = process.env.GHOST_URL || 'http://localhost:2368';
const GHOST_KEY = process.env.GHOST_CONTENT_API_KEY || '';

const GhostPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional().default(''),
  custom_excerpt: z.string().nullable().optional(),
  feature_image: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  reading_time: z.number().optional().default(5),
  primary_tag: z.object({ name: z.string() }).nullable().optional(),
  tags: z.array(z.object({ name: z.string(), slug: z.string() })).optional(),
  html: z.string().optional(),
  authors: z.array(z.object({ name: z.string() })).optional(),
});

async function ghostFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${GHOST_URL}/ghost/api/content/${endpoint}/`);
  url.searchParams.set('key', GHOST_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    next: { tags: ['ghost-posts'], revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Ghost API error: ${res.status}`);
  return res.json();
}

export async function getLatestArticles(limit = 10): Promise<GhostPost[]> {
  try {
    const data = await ghostFetch('posts', {
      limit: String(limit),
      include: 'tags,authors',
      fields: 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag,html',
      order: 'published_at DESC',
    });
    return z.array(GhostPostSchema).parse(data.posts) as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const data = await ghostFetch(`posts/slug/${slug}`, {
      include: 'tags,authors',
    });
    return GhostPostSchema.parse(data.posts[0]) as unknown as GhostPost;
  } catch {
    return null;
  }
}

export async function getArticlesByTag(tag: string, limit = 20): Promise<GhostPost[]> {
  try {
    const data = await ghostFetch('posts', {
      limit: String(limit),
      filter: `tag:${tag}`,
      include: 'tags',
      fields: 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag',
      order: 'published_at DESC',
    });
    return z.array(GhostPostSchema).parse(data.posts) as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const data = await ghostFetch('posts', {
      limit: 'all',
      fields: 'slug',
    });
    return (data.posts as Array<{ slug: string }>).map(p => p.slug);
  } catch {
    return [];
  }
}
```

**Step 2: Update revalidation endpoint**

Create or update `apps/web/app/api/revalidate/route.ts`:
```typescript
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('ghost-posts');
  return Response.json({ revalidated: true, now: Date.now() });
}
```

**Step 3: Commit**

```bash
git add apps/web/lib/ghost.ts apps/web/app/api/revalidate/
git commit -m "feat: Ghost webhook revalidation + Zod validation

- Replaces @tryghost/content-api with typed fetch + cache tags
- Instant revalidation via Ghost webhooks (POST /api/revalidate)
- Zod schema validates all Ghost API responses
- Falls back to 300s time-based revalidation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 2: Core Layout Redesign

### Task 2.1: Redesign Navbar

**Files:**
- Modify: `apps/web/components/layout/Navbar.tsx`

**Step 1: Update nav with new links and shadcn Sheet for mobile**

The navbar needs:
- Updated nav links: Latest, Data Room, Community, Social, About
- shadcn `Sheet` component for mobile menu (replaces AnimatePresence)
- Social links (X, Instagram) in mobile menu
- Improved accessibility (aria labels, keyboard nav)

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { m } from 'motion/react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/articles', label: 'Latest' },
  { href: '/data-room', label: 'Data Room' },
  { href: '/community', label: 'Community' },
  { href: '/social', label: 'Social' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <m.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-red z-[60]"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      <header
        className={cn(
          'fixed top-[2px] left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'glass-strong border-b border-sws-600/50' : 'bg-transparent',
        )}
      >
        <nav className="max-w-container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-red flex items-center justify-center font-display font-black text-sm text-white group-hover:glow-red-strong transition-shadow duration-300">
              SW
            </div>
            <span className="font-display font-bold text-lg text-sws-white hidden sm:block">
              South Ward Signal
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            <Link
              href="/#subscribe"
              className="px-4 py-2 bg-red text-white text-sm font-semibold rounded hover:bg-accent transition-colors duration-200"
            >
              Subscribe
            </Link>
          </div>

          {/* Mobile — shadcn Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                aria-label="Open menu"
              >
                <span className="w-5 h-[2px] bg-sws-white block" />
                <span className="w-5 h-[2px] bg-sws-white block" />
                <span className="w-5 h-[2px] bg-sws-white block" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-bg border-sws-600 pt-16">
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-2xl font-display font-bold text-sws-white hover:text-red transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-sws-600 pt-6 mt-4">
                  <Link
                    href="/#subscribe"
                    className="inline-block px-6 py-3 bg-red text-white font-semibold rounded text-lg w-full text-center"
                  >
                    Subscribe Free
                  </Link>
                </div>
                <div className="flex gap-4 mt-4">
                  <a href="https://twitter.com/SouthWardSignal" target="_blank" rel="noopener noreferrer" className="text-sws-400 hover:text-sws-white transition-colors" aria-label="X (Twitter)">
                    𝕏
                  </a>
                  <a href="https://instagram.com/southwardsignal" target="_blank" rel="noopener noreferrer" className="text-sws-400 hover:text-sws-white transition-colors" aria-label="Instagram">
                    IG
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative group text-sm font-medium text-sws-300 hover:text-sws-white transition-colors duration-200">
      {children}
      <span className="absolute -bottom-1 left-0 h-[2px] bg-red w-0 group-hover:w-full transition-all duration-300 ease-out" />
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/layout/Navbar.tsx
git commit -m "redesign: navbar with Community/Social links, shadcn Sheet mobile menu

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.2: Redesign Footer with Social Links

**Files:**
- Modify: `apps/web/components/layout/Footer.tsx`

Update footer to include Community section, prominent social links, newsletter signup, and the "Data-driven. Supporter-born." descriptor. Remove `framer-motion` import, use `motion/react` if animation needed (or remove animation since footer is always visible when scrolled to).

---

## Phase 3: Homepage Overhaul + Social Feeds

### Task 3.1: Social Feed Components

**Files:**
- Create: `apps/web/components/social/XFeed.tsx`
- Create: `apps/web/components/social/InstagramFeed.tsx`
- Create: `apps/web/app/social/page.tsx`

**Step 1: X (Twitter) Feed Component**

Create `apps/web/components/social/XFeed.tsx` using Twitter's embedded timeline widget:
```tsx
'use client';

import { useEffect, useRef } from 'react';

interface XFeedProps {
  username?: string;
  limit?: number;
  className?: string;
}

export function XFeed({ username = 'SouthWardSignal', limit = 5, className }: XFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widgets.js
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={className}>
      <a
        className="twitter-timeline"
        data-theme="dark"
        data-chrome="noheader nofooter noborders transparent"
        data-tweet-limit={limit}
        data-link-color="#ED1A3D"
        href={`https://twitter.com/${username}`}
      >
        Loading tweets...
      </a>
    </div>
  );
}
```

**Step 2: Instagram Feed Component**

Create `apps/web/components/social/InstagramFeed.tsx`.

For Instagram, the official embed approach uses oEmbed or the Instagram Basic Display API. For a simpler approach, use an iframe embed or a third-party service. The simplest self-hosted approach:

```tsx
'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

interface InstagramPost {
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

interface InstagramFeedProps {
  className?: string;
  limit?: number;
}

export function InstagramFeed({ className, limit = 6 }: InstagramFeedProps) {
  const { data: posts, isLoading } = useQuery<InstagramPost[]>({
    queryKey: ['instagram-feed', limit],
    queryFn: async () => {
      const res = await fetch(`/api/social/instagram?limit=${limit}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-square bg-bg-card rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!posts?.length) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square overflow-hidden rounded group"
          >
            <Image
              src={post.media_url}
              alt={post.caption?.slice(0, 100) || 'Instagram post'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Instagram API route**

Create `apps/web/app/api/social/instagram/route.ts`:
```typescript
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get('limit') || '6';
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return Response.json([], { status: 200 });
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp,media_type&limit=${limit}&access_token=${token}`,
      { next: { revalidate: 600 } } // 10 min cache
    );

    if (!res.ok) return Response.json([], { status: 200 });

    const data = await res.json();
    return Response.json(data.data || []);
  } catch {
    return Response.json([], { status: 200 });
  }
}
```

**Step 4: Social page**

Create `apps/web/app/social/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { XFeed } from '@/components/social/XFeed';
import { InstagramFeed } from '@/components/social/InstagramFeed';

export const metadata: Metadata = {
  title: 'Social',
  description: 'Follow South Ward Signal on X and Instagram for real-time Red Bulls coverage.',
};

export default function SocialPage() {
  return (
    <div className="max-w-container mx-auto px-6 pt-28 pb-20">
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-black mb-4">Social</h1>
        <p className="text-sws-300 text-lg max-w-2xl">
          Real-time coverage from the South Ward. Follow us for match-day updates, stat drops, and supporter culture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* X Feed */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl">𝕏</span>
            <h2 className="font-display text-2xl font-bold">@SouthWardSignal</h2>
            <a
              href="https://twitter.com/SouthWardSignal"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-sws-400 hover:text-sws-white transition-colors"
            >
              Follow →
            </a>
          </div>
          <div className="bg-bg-card rounded-lg border border-sws-600/50 p-4">
            <XFeed limit={8} />
          </div>
        </div>

        {/* Instagram Feed */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl">📸</span>
            <h2 className="font-display text-2xl font-bold">@southwardsignal</h2>
            <a
              href="https://instagram.com/southwardsignal"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-sws-400 hover:text-sws-white transition-colors"
            >
              Follow →
            </a>
          </div>
          <div className="bg-bg-card rounded-lg border border-sws-600/50 p-4">
            <InstagramFeed limit={9} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add apps/web/components/social/ apps/web/app/social/ apps/web/app/api/social/
git commit -m "feat: add Social page with X feed and Instagram feed integration

- XFeed component using Twitter embedded timeline
- InstagramFeed component using Instagram Basic Display API
- API route for Instagram with 10-min cache
- Dedicated /social page with side-by-side feeds

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3.2: Homepage Social Section

**Files:**
- Create: `apps/web/app/sections/SocialPreview.tsx`
- Modify: `apps/web/app/page.tsx`

**Step 1: Create SocialPreview section**

```tsx
import Link from 'next/link';
import { XFeed } from '@/components/social/XFeed';
import { InstagramFeed } from '@/components/social/InstagramFeed';

export function SocialPreview() {
  return (
    <section className="py-20 border-t border-sws-600/30">
      <div className="max-w-container mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">Follow the Signal</p>
            <h2 className="font-display text-3xl md:text-4xl font-black">From the Stands</h2>
          </div>
          <Link href="/social" className="text-sm text-sws-400 hover:text-sws-white transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-bg-card rounded-lg border border-sws-600/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">𝕏</span>
              <span className="text-sm font-mono text-sws-400">@SouthWardSignal</span>
            </div>
            <XFeed limit={3} />
          </div>

          <div className="bg-bg-card rounded-lg border border-sws-600/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">📸</span>
              <span className="text-sm font-mono text-sws-400">@southwardsignal</span>
            </div>
            <InstagramFeed limit={6} />
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add to homepage**

Update `apps/web/app/page.tsx`:
```tsx
import { Hero } from '@/components/hero/Hero';
import { LatestSection } from './sections/LatestSection';
import { DataRoomPreview } from './sections/DataRoomPreview';
import { SocialPreview } from './sections/SocialPreview';
import { AboutPreview } from './sections/AboutPreview';
import { getLatestArticles } from '@/lib/ghost';
import { getLatestMatch, getStandings } from '@/lib/supabase';

export const revalidate = 60;

export default async function HomePage() {
  const [articles, latestMatch, standings] = await Promise.all([
    getLatestArticles(5),
    getLatestMatch(),
    getStandings('Eastern'),
  ]);

  const normalizedArticles = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.custom_excerpt || a.excerpt || '',
    primary_tag: a.primary_tag?.name || a.tags?.[0]?.name || 'Article',
    published_at: a.published_at,
    reading_time: a.reading_time || 5,
    feature_image: a.feature_image || undefined,
  }));

  return (
    <>
      <Hero />
      <LatestSection articles={normalizedArticles} />
      <DataRoomPreview matchData={latestMatch} standingsData={standings} />
      <SocialPreview />
      <AboutPreview />
    </>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/app/sections/SocialPreview.tsx apps/web/app/page.tsx
git commit -m "feat: add social feeds section to homepage

X and Instagram feeds preview between DataRoom and About sections.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 4: Content System Enrichment

### Task 4.1: Article Page Enhancements

**Files:**
- Modify: `apps/web/app/articles/[slug]/page.tsx`
- Create: `apps/web/components/articles/ReadingProgress.tsx`
- Create: `apps/web/components/articles/TableOfContents.tsx`
- Create: `apps/web/components/articles/SocialShare.tsx`

Add reading progress bar (fixed top, red gradient), auto-generated table of contents from article headings, social sharing buttons (X, Instagram story link, copy link), and related articles sidebar.

### Task 4.2: Articles Listing with Content Type Filtering

**Files:**
- Modify: `apps/web/app/articles/page.tsx`
- Modify: `apps/web/app/articles/ArticlesPageClient.tsx`

Update tag filtering to support the 15 content types defined in the content strategy. Use shadcn `Tabs` or pill-style filters.

### Task 4.3: Newsletter Pages

**Files:**
- Create: `apps/web/app/newsletter/page.tsx`

Dedicated newsletter landing page with Ghost newsletter signup, archive of past newsletters, and preview of what subscribers get.

---

## Phase 5: Data Room Upgrades

### Task 5.1: Metric Tooltips + Progressive Disclosure

**Files:**
- Create: `apps/web/components/data/MetricTooltip.tsx`
- Modify: `apps/web/components/data/MetricCard.tsx`
- Create: `apps/web/lib/metric-definitions.ts`

Create a dictionary of metric explanations (xG, PPDA, Goals Added, etc.) and wrap MetricCard with shadcn `Tooltip` for hover explanations.

### Task 5.2: Client-Side Filtering with TanStack Query

**Files:**
- Modify: `apps/web/app/data-room/matches/page.tsx`
- Modify: `apps/web/app/data-room/players/page.tsx`

Replace full-page navigation for filter changes with TanStack Query + client-side filtering. Season, result, position filters update instantly.

### Task 5.3: Supabase Realtime for Live Matches

**Files:**
- Create: `apps/web/lib/realtime.ts`
- Modify: `apps/web/app/data-room/matches/[matchId]/page.tsx`

Subscribe to `matches` table changes filtered by `status = 'live'`. Invalidate TanStack Query cache on update. Only connect when viewing a live match page.

---

## Phase 6: Community Features

### Task 6.1: Supabase Schema for Community

**Files:**
- Create: `supabase/migrations/20260311000000_community_tables.sql`

Tables needed:
- `match_ratings` (user_id, match_id, player_id, rating 1-10, created_at)
- `predictions` (user_id, match_id, home_score, away_score, created_at)
- `prediction_leaderboard` (view, calculated from predictions accuracy)
- `polls` (id, question, options jsonb, match_id nullable, expires_at)
- `poll_votes` (poll_id, user_id, option_index, created_at)

### Task 6.2: Community Page + Components

**Files:**
- Create: `apps/web/app/community/page.tsx`
- Create: `apps/web/components/community/PredictionForm.tsx`
- Create: `apps/web/components/community/PlayerRating.tsx`
- Create: `apps/web/components/community/PollCard.tsx`
- Create: `apps/web/components/community/Leaderboard.tsx`

### Task 6.3: Match-Day Mode

**Files:**
- Create: `apps/web/lib/match-day.ts`
- Modify: `apps/web/app/page.tsx`

Detect match-day state (PRE-MATCH / LIVE / POST-MATCH) based on next match date from Supabase. Transform homepage hero and content sections based on state:
- PRE-MATCH: Countdown, lineup predictions, preview link
- LIVE: Score ticker, live stats link, match thread
- POST-MATCH: Final score, player ratings CTA, recap link

---

## Execution Notes

- **Each phase should be committed atomically** — the site should build at the end of every phase
- **Phase 1 is the critical path** — everything else depends on the foundation being solid
- **Social feeds (Phase 3)** require environment variables: `INSTAGRAM_ACCESS_TOKEN`
- **Community features (Phase 6)** require Supabase auth to be set up for user identity
- **Test at each phase** — run `npx next build` to verify no breakage
- **The design brief and agent reports** in `/docs/` contain detailed specifications for visual styling, component patterns, and content templates that should be referenced during implementation
