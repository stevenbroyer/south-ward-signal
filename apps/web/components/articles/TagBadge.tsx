'use client';

const TAG_COLORS: Record<string, string> = {
  'Match Recap': '#ED1A3D',
  'Preview': '#3B82F6',
  'Player Spotlight': '#D4A843',
  'Power Rankings': '#8B5CF6',
  'Transfer Intel': '#22C55E',
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
