'use client';

import Link from 'next/link';

const footerLinks = {
  coverage: [
    { label: 'Latest', href: '/articles' },
    { label: 'Data Room', href: '/data-room' },
    { label: 'Social', href: '/social' },
    { label: 'About', href: '/about' },
  ],
  data: [
    { label: 'Overview', href: '/data-room' },
    { label: 'Standings', href: '/data-room/league' },
    { label: 'Players', href: '/data-room/players' },
    { label: 'Matches', href: '/data-room/matches' },
    { label: 'Team Stats', href: '/data-room/team' },
  ],
};

const socialLinks = [
  { label: 'X / Twitter', href: 'https://twitter.com/SouthWardSignal' },
  { label: 'Instagram', href: 'https://instagram.com/southwardsignal' },
];

export function Footer() {
  return (
    <footer className="border-t border-sws-600/50 mt-32">
      <div className="max-w-container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sws-logo.svg"
                alt="South Ward Signal"
                width={32}
                height={32}
              />
              <span className="font-display font-bold text-lg">South Ward Signal</span>
            </Link>
            <p className="text-sm text-sws-400 leading-relaxed mb-4">
              Data-driven. Supporter-born.
            </p>
            <p className="text-xs text-sws-500 leading-relaxed">
              Independent coverage of the New York Red Bulls. Every take backed by real numbers.
            </p>
          </div>

          {/* Pages */}
          <div>
            <h4 className="text-xs font-mono font-bold text-sws-400 uppercase tracking-widest mb-4">Pages</h4>
            <ul className="space-y-3">
              {footerLinks.coverage.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sws-300 hover:text-sws-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data */}
          <div>
            <h4 className="text-xs font-mono font-bold text-sws-400 uppercase tracking-widest mb-4">Data Room</h4>
            <ul className="space-y-3">
              {footerLinks.data.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sws-300 hover:text-sws-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-mono font-bold text-sws-400 uppercase tracking-widest mb-4">Follow</h4>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
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
        <div className="mt-16 pt-8 border-t border-sws-600/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sws-500">
            &copy; {new Date().getFullYear()} South Ward Signal. Independent supporter media.
          </p>
          <p className="text-xs text-sws-500">
            Not affiliated with RBNY or MLS.
          </p>
        </div>
      </div>
    </footer>
  );
}
