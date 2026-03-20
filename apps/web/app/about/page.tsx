'use client';

import { motion } from 'motion/react';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-container mx-auto px-6">
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">About</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white mb-6">
              Built from the South Ward.
            </h1>
            <p className="text-sws-300 text-lg leading-relaxed">
              Independent coverage of the New York Red Bulls that treats the club
              like it actually matters. Because it does.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left column */}
          <div>
            <RevealOnScroll>
              <div className="space-y-5 text-sws-300 leading-relaxed">
                <p>
                  ESPN gives MLS a paragraph on a good day. The Athletic covers maybe
                  four clubs. Your local beat writer files copy that reads like a box score
                  with adjectives. We got tired of it.
                </p>
                <p>
                  South Ward Signal is named after the supporters&apos; section at Red Bull
                  Arena. Section 133 and the seats around it, where the drums don&apos;t stop
                  and the scarves go up before kickoff. That&apos;s where this started: fans
                  who wanted to understand what was happening on the pitch, not just react to it.
                </p>
                <p>
                  So we built something. Match recaps that go beyond &quot;RBNY won 2-1&quot;
                  and into why. Where the press broke down, which runs created space, what
                  the xG tells us about a result the scoreline doesn&apos;t. Player analysis
                  that looks at actual output, not reputation. Honest takes on signings,
                  tactics, and front office decisions.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <h2 className="font-display font-bold text-xl text-sws-white mb-5 mt-12">
                How we think about this
              </h2>
              <div className="space-y-5 text-sws-300 leading-relaxed">
                <p>
                  If we make a claim, there&apos;s a number behind it. If the data isn&apos;t
                  there, we say that too. We&apos;d rather publish nothing than publish something
                  we can&apos;t back up.
                </p>
                <p>
                  We also think speed matters. A match recap that shows up three days later is
                  useless. Ours go up fast, same night when possible, but we don&apos;t trade
                  accuracy for it. Getting it right beats getting it first.
                </p>
                <p>
                  Arsenal has The Athletic, Tifo, and a dozen independent sites doing deep tactical
                  work. RBNY deserves at least one. That&apos;s the gap we&apos;re filling.
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right column */}
          <div>
            <RevealOnScroll direction="right">
              <h2 className="font-display font-bold text-xl text-sws-white mb-8">
                What you get
              </h2>
            </RevealOnScroll>

            <div className="space-y-6">
              <RevealOnScroll direction="right" delay={0.05}>
                <div className="border-l-2 border-red/40 pl-5">
                  <h3 className="font-display font-bold text-sws-white text-base mb-2">
                    Match coverage
                  </h3>
                  <p className="text-sm text-sws-400 leading-relaxed">
                    Post-match breakdowns with xG, possession chains, and what actually
                    mattered. Pre-match previews with lineups, form, and the matchups
                    worth watching.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="right" delay={0.1}>
                <div className="border-l-2 border-red/40 pl-5">
                  <h3 className="font-display font-bold text-sws-white text-base mb-2">
                    Player analysis
                  </h3>
                  <p className="text-sm text-sws-400 leading-relaxed">
                    Statistical profiles, percentile rankings, and honest assessments. Not
                    hype pieces. If a player is underperforming relative to their xG, we&apos;ll
                    say so.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="right" delay={0.15}>
                <div className="border-l-2 border-red/40 pl-5">
                  <h3 className="font-display font-bold text-sws-white text-base mb-2">
                    The data room
                  </h3>
                  <p className="text-sm text-sws-400 leading-relaxed">
                    Standings, match stats, player comparisons, and team performance
                    metrics, all in one place. Updated after every match.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="right" delay={0.2}>
                <div className="border-l-2 border-red/40 pl-5">
                  <h3 className="font-display font-bold text-sws-white text-base mb-2">
                    Transfer intel
                  </h3>
                  <p className="text-sm text-sws-400 leading-relaxed">
                    Scouting profiles and squad analysis when the windows open. Where does
                    the roster have holes? Who fits the system? What does the money look like?
                  </p>
                </div>
              </RevealOnScroll>

            </div>

          </div>
        </div>

        {/* Bottom */}
        <RevealOnScroll delay={0.2}>
          <div className="mt-20 pt-12 border-t border-sws-700/30 max-w-2xl">
            <p className="text-sws-500 text-sm leading-relaxed">
              South Ward Signal is not affiliated with, endorsed by, or connected to
              the New York Red Bulls, Red Bull GmbH, or Major League Soccer. We&apos;re
              fans with opinions and a database.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </div>
  );
}
