import type { Metadata, Viewport } from 'next';
import { sourceSans, jetbrainsMono } from '@/lib/fonts';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CustomCursor } from '@/components/ui/Cursor';
import { PageTransition } from '@/components/ui/PageTransition';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Fraunces from Google Fonts as preconnect — local font as primary, CDN fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-sws-white font-body antialiased">
        <SmoothScroll>
          <CustomCursor />
          <Navbar />
          <PageTransition>
            <main className="min-h-screen">{children}</main>
          </PageTransition>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
