'use client';

import { motion } from 'motion/react';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

const coverageTypes = [
  { icon: '01', title: 'Match Recaps', desc: 'Post-match analysis within hours, backed by xG, possession chains, and pressing data.' },
  { icon: '02', title: 'Tactical Previews', desc: 'Pre-match breakdowns with predicted lineups, key matchups, and historical data.' },
  { icon: '03', title: 'Player Spotlights', desc: 'Deep statistical profiles using radar charts, heat maps, and percentile rankings.' },
  { icon: '04', title: 'Power Rankings', desc: 'Weekly Eastern Conference rankings driven by expected points models.' },
  { icon: '05', title: 'Transfer Intel', desc: 'Data-driven scouting profiles for potential signings and squad analysis.' },
  { icon: '06', title: 'Stat of the Week', desc: 'One standout metric explained in context — what it means and why it matters.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-container mx-auto px-6">
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-16">
            <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">About</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white">South Ward Signal</h1>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left — Mission */}
          <div>
            <RevealOnScroll>
              <h2 className="font-display font-bold text-2xl text-sws-white mb-6">The Mission</h2>
              <div className="space-y-5 text-sws-300 leading-relaxed">
                <p>
                  South Ward Signal is independent, data-driven coverage of the New York Red Bulls.
                  We combine advanced analytics with editorial storytelling to give supporters the
                  analysis they deserve — fast, accurate, and transparent.
                </p>
                <p>
                  Named after the supporters section at Red Bull Arena, this publication is built for
                  the fans who care about the numbers behind the game. Every match recap includes xG
                  breakdowns. Every preview is informed by statistical models. Every player profile
                  is grounded in percentile rankings and advanced metrics.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <h2 className="font-display font-bold text-2xl text-sws-white mb-6 mt-12">Our Approach</h2>
              <div className="space-y-5 text-sws-300 leading-relaxed">
                <p>
                  We use data from American Soccer Analysis, FBref, and official MLS feeds to power
                  our analysis. Articles are generated using AI models trained on soccer analytics,
                  then verified against the underlying data before publication.
                </p>
                <p>
                  Speed matters. Match recaps go live within hours, not days. But accuracy matters
                  more — every claim is backed by a number, every number is sourced, and every
                  source is cited.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2}>
              <h2 className="font-display font-bold text-2xl text-sws-white mb-6 mt-12">AI Transparency</h2>
              <div className="space-y-5 text-sws-300 leading-relaxed">
                <p>
                  South Ward Signal is upfront about its use of AI. Articles are AI-generated using
                  real data and publicly available information. We believe AI can democratize sports
                  journalism — giving smaller clubs the analytical coverage usually reserved for the
                  biggest teams.
                </p>
                <p>
                  Every article includes an AI disclosure. We never fabricate statistics. If we
                  don&apos;t have the data, we say so. Transparency is non-negotiable.
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right — Coverage Types */}
          <div>
            <RevealOnScroll direction="right">
              <h2 className="font-display font-bold text-2xl text-sws-white mb-8">What We Cover</h2>
            </RevealOnScroll>

            <div className="space-y-4">
              {coverageTypes.map((type, i) => (
                <RevealOnScroll key={type.title} direction="right" delay={i * 0.08}>
                  <motion.div
                    className="bg-bg-card border border-sws-700/50 rounded-lg p-5 hover:border-sws-600/80 transition-colors group"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-xs font-mono text-red/60 shrink-0 mt-1 w-6">{type.icon}</span>
                      <div>
                        <h3 className="font-display font-bold text-sws-white text-base group-hover:text-accent transition-colors">
                          {type.title}
                        </h3>
                        <p className="text-sm text-sws-400 mt-1 leading-relaxed">{type.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                </RevealOnScroll>
              ))}
            </div>

            {/* Data Sources */}
            <RevealOnScroll direction="right" delay={0.5}>
              <div className="mt-10 bg-bg-elevated rounded-lg p-5 border border-sws-700/30">
                <p className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-3">Data Sources</p>
                <div className="flex flex-wrap gap-3">
                  {['American Soccer Analysis', 'FBref', 'MLS API', 'API-Football', 'Opta'].map((src) => (
                    <span key={src} className="text-xs font-mono text-sws-400 bg-bg-card px-3 py-1.5 rounded border border-sws-700/30">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </div>
  );
}
