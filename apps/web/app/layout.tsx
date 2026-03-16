import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import { fraunces, sourceSans, jetbrainsMono } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { QueryProvider } from '@/lib/query-provider';
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head />
      <body className="bg-bg text-sws-white font-body antialiased">
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "vwhom0b8z1");`}
        </Script>
        {isAdmin ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <QueryProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-red focus:text-white focus:rounded">
              Skip to content
            </a>
            <Navbar />
            <main id="main-content" className="min-h-screen">{children}</main>
            <Footer />
          </QueryProvider>
        )}
      </body>
    </html>
  );
}
