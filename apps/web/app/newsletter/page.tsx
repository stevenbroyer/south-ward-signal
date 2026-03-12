import type { Metadata } from 'next';
import { NewsletterSignup } from './NewsletterSignup';

export const metadata: Metadata = {
  title: 'Newsletter',
  description:
    'Subscribe to South Ward Signal newsletters — weekly Red Bulls coverage, match-day alerts, and monthly analytics digests.',
};

const newsletters = [
  {
    name: 'The Signal',
    frequency: 'Weekly — Mondays',
    description:
      'Your weekly Red Bulls intelligence briefing. Match recaps, key stats, tactical takeaways, and what to watch for next. Everything you need to be the smartest fan in the section.',
    features: [
      'Match recaps with xG analysis',
      'Key stat of the week',
      'Tactical observations',
      'Preview of the week ahead',
    ],
    tag: 'weekly',
  },
  {
    name: 'Match Day',
    frequency: 'Match days — 6 hours before kickoff',
    description:
      'Pre-match briefing delivered before every Red Bulls match. Lineups, form guide, key matchups, and our prediction.',
    features: [
      'Expected lineups',
      'Form guide and head-to-head',
      'Key matchup analysis',
      'Score prediction with reasoning',
    ],
    tag: 'matchday',
  },
  {
    name: 'The Data Sheet',
    frequency: 'Monthly',
    description:
      "Deep-dive analytics digest for data enthusiasts. Advanced metrics, visualizations, and insights you won't find anywhere else.",
    features: [
      'Advanced metrics breakdown',
      'Custom data visualizations',
      'Player performance analysis',
      'League-wide comparisons',
    ],
    tag: 'data',
  },
];

export default function NewsletterPage() {
  return (
    <div className="max-w-container mx-auto px-6 pt-28 pb-20">
      {/* Header */}
      <div className="max-w-2xl mb-16">
        <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-3">
          Get The Signal
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-black mb-6">
          Red Bulls coverage,
          <br />
          <span className="text-gradient">straight to your inbox.</span>
        </h1>
        <p className="text-sws-300 text-lg leading-relaxed">
          Data-driven analysis and supporter-native coverage of the New York Red Bulls. Three
          newsletters, each serving a different need. All free.
        </p>
      </div>

      {/* Signup form */}
      <div className="mb-20">
        <NewsletterSignup />
      </div>

      {/* Newsletter descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {newsletters.map((nl) => (
          <div
            key={nl.name}
            className="bg-bg-card border border-sws-600/50 rounded-lg p-8 hover:border-sws-400/50 transition-colors"
          >
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold mb-2">{nl.name}</h2>
              <p className="text-xs font-mono text-red uppercase tracking-wider">{nl.frequency}</p>
            </div>
            <p className="text-sws-300 text-sm leading-relaxed mb-6">{nl.description}</p>
            <ul className="space-y-2">
              {nl.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-sws-400">
                  <span className="text-red mt-1 flex-shrink-0">&mdash;</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 text-center">
        <p className="text-sws-400 text-sm">
          All newsletters are free. Unsubscribe anytime. No spam, just signal.
        </p>
      </div>
    </div>
  );
}
