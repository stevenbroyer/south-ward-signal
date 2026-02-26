'use client';

import { useRef, useEffect, useState } from 'react';

const stats = [
  { value: 2.81, label: 'RBNY xG', decimals: 2 },
  { value: 142, label: 'PRESS ACT', decimals: 0 },
  { value: 58, label: 'POSS %', decimals: 0, suffix: '%' },
];

function useCountUp(target: number, duration: number, decimals: number, trigger: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let start = 0;
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * target).toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }, [target, duration, decimals, trigger]);

  return value;
}

export function HeroStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-8 md:gap-12">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-8 md:gap-12">
          {i > 0 && <div className="w-[1px] h-8 bg-sws-700" />}
          <StatItem {...stat} trigger={visible} index={i} />
        </div>
      ))}
    </div>
  );
}

function StatItem({
  value: target,
  label,
  decimals,
  suffix = '',
  trigger,
  index,
}: {
  value: number;
  label: string;
  decimals: number;
  suffix?: string;
  trigger: boolean;
  index: number;
}) {
  const value = useCountUp(target, 1.2 + index * 0.2, decimals, trigger);

  return (
    <div className="flex flex-col">
      <span className="font-mono font-bold text-2xl md:text-3xl text-sws-white tabular-nums">
        {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
        <span className="text-red">{suffix}</span>
      </span>
      <span className="text-[10px] font-mono text-sws-500 uppercase tracking-[0.25em] mt-1">
        {label}
      </span>
    </div>
  );
}
