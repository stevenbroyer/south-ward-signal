import type { Metadata } from 'next';
import { XFeed } from '@/components/social/XFeed';
import { InstagramFeed } from '@/components/social/InstagramFeed';

export const metadata: Metadata = {
  title: 'Social',
  description: 'Follow South Ward Signal on X and Instagram for real-time Red Bulls coverage, stat drops, and supporter culture.',
};

export default function SocialPage() {
  return (
    <div className="max-w-container mx-auto px-6 pt-28 pb-20">
      <div className="mb-12">
        <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-3">Follow the Signal</p>
        <h1 className="font-display text-4xl md:text-5xl font-black mb-4">Social</h1>
        <p className="text-sws-300 text-lg max-w-2xl">
          Real-time coverage from the South Ward. Match-day updates, stat drops, and supporter culture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* X Feed */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-2xl font-bold">@SouthWardSignal</h2>
            <a
              href="https://twitter.com/SouthWardSignal"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-1.5 text-sm border border-sws-600 rounded text-sws-300 hover:text-sws-white hover:border-sws-400 transition-colors"
            >
              Follow on X
            </a>
          </div>
          <div className="bg-bg-card rounded-lg border border-sws-600/50 p-4 min-h-[400px]">
            <XFeed limit={8} />
          </div>
        </div>

        {/* Instagram Feed */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-2xl font-bold">@southwardsignal</h2>
            <a
              href="https://instagram.com/southwardsignal"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-1.5 text-sm border border-sws-600 rounded text-sws-300 hover:text-sws-white hover:border-sws-400 transition-colors"
            >
              Follow on IG
            </a>
          </div>
          <div className="bg-bg-card rounded-lg border border-sws-600/50 p-4 min-h-[400px]">
            <InstagramFeed limit={9} />
          </div>
        </div>
      </div>
    </div>
  );
}
