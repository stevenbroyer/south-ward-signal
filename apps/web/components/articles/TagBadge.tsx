'use client';

const TAG_COLORS: Record<string, string> = {
  'Match Recap': '#ED1A3D',
  'Preview': '#3B82F6',
  'Tactical Analysis': '#06B6D4',
  'Player Spotlight': '#D4A843',
  'Transfer Intel': '#22C55E',
  'Data Deep-Dive': '#F59E0B',
  'Opinion': '#EC4899',
  'Supporter Culture': '#A855F7',
  'Historical': '#78716C',
  'Power Rankings': '#8B5CF6',
  'Weekly Roundup': '#14B8A6',
  'Stat of the Week': '#F59E0B',
};

interface TagBadgeProps {
  tag: string;
  className?: string;
}

export function TagBadge({ tag, className = '' }: TagBadgeProps) {
  const color = TAG_COLORS[tag] || '#6E6E7A';

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest ${className}`}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      {tag}
    </span>
  );
}
