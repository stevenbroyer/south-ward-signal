'use client';

interface AdminHeaderProps {
  title: string;
  userEmail?: string;
  onSignOut?: () => void;
  onMenuClick?: () => void;
}

export function AdminHeader({ title, userEmail, onSignOut, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="h-14 border-b border-sws-700/50 bg-bg-card px-4 md:px-6 flex items-center justify-between shrink-0 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden -ml-1 p-1.5 text-sws-300 hover:text-sws-white transition-colors"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <h1 className="font-display text-base md:text-lg font-bold text-sws-white truncate">{title}</h1>
      </div>

      {userEmail && (
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs font-mono text-sws-400 truncate max-w-[180px]">{userEmail}</span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-xs text-sws-400 hover:text-red transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
