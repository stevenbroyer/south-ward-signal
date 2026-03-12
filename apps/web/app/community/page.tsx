import { CommunityClient } from './CommunityClient';

export const metadata = {
  title: 'Community | South Ward Signal',
  description:
    'Join the South Ward community — rate players, predict scores, and compete on the leaderboard.',
};

export default function CommunityPage() {
  return (
    <section className="min-h-screen pt-32 pb-24 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-base via-bg-base to-bg-card/50" />

      <div className="max-w-container mx-auto px-6 relative z-10">
        {/* Header */}
        <p className="text-[10px] font-mono text-sws-500 uppercase tracking-widest mb-3">
          The South Ward
        </p>
        <h1 className="text-3xl md:text-5xl font-display font-black text-sws-white mb-2">
          Community
        </h1>
        <div className="h-1 w-16 bg-red-gradient rounded-full mb-4" />
        <p className="text-sws-400 max-w-xl mb-12">
          Rate players, predict scores, vote in polls, and compete on the
          leaderboard.
        </p>

        {/* Tabs */}
        <CommunityClient />
      </div>
    </section>
  );
}
