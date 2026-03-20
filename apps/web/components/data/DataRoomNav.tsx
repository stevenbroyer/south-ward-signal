'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Overview', href: '/data-room' },
  { label: 'Match Center', href: '/data-room/matches' },
  { label: 'Players', href: '/data-room/players' },
  { label: 'Team', href: '/data-room/team' },
  { label: 'League', href: '/data-room/league' },
] as const;

export function DataRoomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/data-room') return pathname === '/data-room';
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 rounded-lg text-sm font-mono whitespace-nowrap transition-all duration-200 ${
            isActive(tab.href)
              ? 'bg-red/10 text-red border border-red/20 font-medium'
              : 'text-sws-400 hover:text-sws-200 hover:bg-sws-700/30 border border-transparent'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
