'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const footerLinks = {
  coverage: [
    { label: 'Latest', href: '/articles' },
    { label: 'Match Recaps', href: '/articles?tag=match-recap' },
    { label: 'Previews', href: '/articles?tag=preview' },
    { label: 'Transfer Intel', href: '/articles?tag=transfer-intel' },
  ],
  data: [
    { label: 'Data Room', href: '/data-room' },
    { label: 'Standings', href: '/data-room#standings' },
    { label: 'Player Stats', href: '/data-room#players' },
  ],
  social: [
    { label: 'Twitter / X', href: 'https://twitter.com/SouthWardSignal', external: true },
    { label: 'Instagram', href: 'https://instagram.com/southwardsignal', external: true },
    { label: 'TikTok', href: 'https://tiktok.com/@southwardsignal', external: true },
    { label: 'Bluesky', href: 'https://bsky.app/profile/southwardsignal.bsky.social', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-sws-600/50 mt-32">
      <div className="max-w-container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-red flex items-center justify-center font-display font-black text-sm text-white">
                SW
              </div>
              <span className="font-display font-bold text-lg">South Ward Signal</span>
            </Link>
            <p className="text-sm text-sws-400 leading-relaxed">
              Independent, data-driven coverage of the New York Red Bulls. AI-powered analysis backed by real numbers.
            </p>
          </div>

          {/* Coverage */}
          <div>
            <h4 className="text-xs font-mono font-bold text-sws-400 uppercase tracking-widest mb-4">Coverage</h4>
            <ul className="space-y-3">
              {footerLinks.coverage.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sws-300 hover:text-sws-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data */}
          <div>
            <h4 className="text-xs font-mono font-bold text-sws-400 uppercase tracking-widest mb-4">Data</h4>
            <ul className="space-y-3">
              {footerLinks.data.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sws-300 hover:text-sws-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-mono font-bold text-sws-400 uppercase tracking-widest mb-4">Social</h4>
            <ul className="space-y-3">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sws-300 hover:text-sws-white hover:translate-x-1 transition-all inline-flex items-center gap-2"
                  >
                    {link.label}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-40">
                      <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="mt-16 pt-8 border-t border-sws-600/30 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-xs text-sws-500">
            &copy; {new Date().getFullYear()} South Ward Signal. Independent supporter media.
          </p>
          <p className="text-xs text-sws-500">
            Data from ASA, API-Football &amp; FBref. Not affiliated with NYRB or MLS.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
