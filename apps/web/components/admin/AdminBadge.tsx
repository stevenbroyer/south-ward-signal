const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  published: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  draft: { bg: 'bg-sws-400/10', text: 'text-sws-400', border: 'border-sws-400/30' },
  failed: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/30' },
  queued: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  posted: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  cancelled: { bg: 'bg-sws-400/10', text: 'text-sws-400', border: 'border-sws-400/30' },
  finished: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  live: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/30' },
  postponed: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const TAG_COLORS: Record<string, string> = {
  'match-recap': '#ED1A3D',
  'pre-match-preview': '#3B82F6',
  'player-spotlight': '#D4A843',
  'power-rankings': '#8B5CF6',
  'transfer-intel': '#22C55E',
  'stat-of-week': '#F59E0B',
  'weekly-roundup': '#EC4899',
};

interface AdminBadgeProps {
  status: string;
  className?: string;
}

export function AdminBadge({ status, className = '' }: AdminBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles.bg} ${styles.text} ${styles.border} ${className}`}>
      {status}
    </span>
  );
}

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const color = TAG_COLORS[type] ?? '#6E6E7A';
  const label = type.replace(/-/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono capitalize ${className}`}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}
