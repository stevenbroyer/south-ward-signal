'use client';

type FormResult = 'W' | 'D' | 'L';

interface FormBadgeProps {
  form: FormResult[];
  className?: string;
}

const colorMap: Record<FormResult, string> = {
  W: 'bg-success',
  D: 'bg-amber-500',
  L: 'bg-red',
};

export function FormBadge({ form, className = '' }: FormBadgeProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {form.map((result, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded-full text-[9px] font-mono font-bold flex items-center justify-center text-white ${colorMap[result]}`}
          title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
