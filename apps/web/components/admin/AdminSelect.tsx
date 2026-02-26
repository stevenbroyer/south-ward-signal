'use client';

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function AdminSelect({ value, onChange, options, className = '' }: AdminSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-bg-elevated border border-sws-700/50 rounded-lg px-3 py-1.5 text-sm text-sws-white
        focus:outline-none focus:border-red/50 transition-colors appearance-none cursor-pointer ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
