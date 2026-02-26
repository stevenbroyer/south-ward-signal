'use client';

interface AdminHeaderProps {
  title: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export function AdminHeader({ title, userEmail, onSignOut }: AdminHeaderProps) {
  return (
    <header className="h-14 border-b border-sws-700/50 bg-bg-card px-6 flex items-center justify-between shrink-0">
      <h1 className="font-display text-lg font-bold text-sws-white">{title}</h1>

      {userEmail && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-sws-400">{userEmail}</span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-xs text-sws-400 hover:text-red transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
