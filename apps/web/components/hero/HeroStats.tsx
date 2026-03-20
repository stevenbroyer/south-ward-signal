'use client';

import { useRef, useEffect, useState } from 'react';

interface HeroData {
  record: { wins: number; draws: number; losses: number; points: number; position: number; gf: number; ga: number; form: string[] } | null;
  nextMatch: { date: string; opponent: string; isHome: boolean } | null;
}

function useCountUp(target: number, duration: number, decimals: number, trigger: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }, [target, duration, decimals, trigger]);

  return value;
}

function FormDots({ form }: { form: string[] }) {
  return (
    <div className="flex gap-1">
      {form.slice(-5).map((r, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-sws-400' : 'bg-red'
          }`}
        />
      ))}
    </div>
  );
}

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const dateFormatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return dateFormatted;
  return dateFormatted;
}

export function HeroStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<HeroData | null>(null);

  useEffect(() => {
    fetch('/api/hero-stats')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const rec = data?.record;
  const next = data?.nextMatch;

  // Fallback stats if no data yet
  const stats = rec
    ? [
        { value: rec.points, label: 'PTS', decimals: 0 },
        { value: rec.wins, label: 'W', decimals: 0 },
        { value: rec.draws, label: 'D', decimals: 0 },
        { value: rec.losses, label: 'L', decimals: 0 },
        { value: rec.gf, label: 'GF', decimals: 0 },
      ]
    : [
        { value: 0, label: 'PTS', decimals: 0 },
        { value: 0, label: 'W', decimals: 0 },
        { value: 0, label: 'D', decimals: 0 },
        { value: 0, label: 'L', decimals: 0 },
        { value: 0, label: 'GF', decimals: 0 },
      ];

  return (
    <div ref={ref} className="space-y-4">
      {/* Season record */}
      <div className="flex items-center gap-6 md:gap-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-6 md:gap-8">
            {i > 0 && <div className="w-[1px] h-6 bg-sws-700" />}
            <StatItem value={stat.value} label={stat.label} decimals={stat.decimals} trigger={visible} index={i} />
          </div>
        ))}
      </div>

      {/* Form + Next match */}
      <div className="flex items-center gap-6 flex-wrap">
        {rec?.form && rec.form.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-sws-500 uppercase tracking-wider">Form</span>
            <FormDots form={rec.form} />
          </div>
        )}
        {next && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-sws-500 uppercase tracking-wider">Next</span>
            <span className="text-[11px] font-mono text-sws-300">
              {next.isHome ? `vs ${next.opponent}` : `@ ${next.opponent}`}
            </span>
            <span className="text-[10px] font-mono text-sws-500">{formatMatchDate(next.date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ value: target, label, decimals, trigger, index }: {
  value: number; label: string; decimals: number; trigger: boolean; index: number;
}) {
  const value = useCountUp(target, 1.0 + index * 0.1, decimals, trigger);

  return (
    <div className="flex flex-col">
      <span className="font-mono font-bold text-xl md:text-2xl text-sws-white tabular-nums">
        {Math.round(value)}
      </span>
      <span className="text-[10px] font-mono text-sws-500 uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}
