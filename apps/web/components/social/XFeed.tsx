'use client';

import { useEffect, useRef } from 'react';

interface XFeedProps {
  username?: string;
  limit?: number;
  className?: string;
}

export function XFeed({ username = 'SouthWardSignal', limit = 5, className }: XFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      // Re-render widgets if script already loaded
      if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(containerRef.current);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
  }, [username, limit]);

  return (
    <div ref={containerRef} className={className}>
      <a
        className="twitter-timeline"
        data-theme="dark"
        data-chrome="noheader nofooter noborders transparent"
        data-tweet-limit={limit}
        data-link-color="#ED1A3D"
        href={`https://twitter.com/${username}`}
      >
        <p className="text-sws-400 text-sm">Loading posts from @{username}...</p>
      </a>
    </div>
  );
}
