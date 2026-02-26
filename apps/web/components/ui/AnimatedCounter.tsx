'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const el = counterRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: value,
            duration,
            ease: 'power4.out',
            onUpdate: () => {
              setDisplay(
                `${prefix}${obj.val.toLocaleString('en-US', {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })}${suffix}`
              );
            },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, prefix, suffix, decimals]);

  return (
    <span ref={counterRef} className={`font-mono tabular-nums ${className}`}>
      {display}
    </span>
  );
}
