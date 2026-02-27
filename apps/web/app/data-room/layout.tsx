import { Suspense } from 'react';
import { DataRoomNav } from '@/components/data/DataRoomNav';
import { SeasonSelector } from '@/components/data/SeasonSelector';

export const metadata = {
  title: 'Data Room',
  description: 'The most detailed free Red Bulls/MLS data room on the internet. Advanced xG analytics, Goals Added, player comparisons, and historical trends.',
};

export default function DataRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">Analytics</p>
              <h1 className="font-display font-black text-4xl md:text-5xl text-sws-white">Data Room</h1>
              <p className="text-sws-400 mt-3 max-w-lg">
                Advanced metrics, match data, and statistical analysis for the New York Red Bulls.
              </p>
            </div>
            <Suspense fallback={<div className="w-32 h-10 bg-bg-card rounded-lg animate-pulse" />}>
              <SeasonSelector />
            </Suspense>
          </div>

          {/* Tab Navigation */}
          <Suspense fallback={<div className="h-10 bg-bg-card rounded-lg animate-pulse" />}>
            <DataRoomNav />
          </Suspense>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
