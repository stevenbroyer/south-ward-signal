'use client';

import { useEffect } from 'react';

export default function DataRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Data Room Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      <div className="bg-bg-card border border-sws-700/50 rounded-xl p-8 max-w-md w-full">
        <p className="text-xs font-mono text-red uppercase tracking-widest mb-3">
          Something went wrong
        </p>
        <h2 className="font-display font-bold text-xl text-sws-white mb-2">
          Data Room Error
        </h2>
        <p className="text-sm text-sws-400 font-mono mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-red text-white text-xs font-mono uppercase tracking-wider rounded-lg hover:bg-red/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
