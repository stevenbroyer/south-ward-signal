'use client';

import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { MetricTooltip } from '@/components/data/MetricTooltip';

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  /** Explicit metric definition key. If omitted, the label is used for auto-lookup. */
  metricKey?: string;
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  trend,
  className = '',
  metricKey,
}: MetricCardProps) {
  const resolvedKey = metricKey || label;

  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-lg p-5 ${className}`}>
      <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
        <MetricTooltip metricKey={resolvedKey}>
          <span>{label}</span>
        </MetricTooltip>
      </p>
      <div className="flex items-end gap-2">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-3xl font-bold text-sws-white"
        />
        {trend && trend !== 'neutral' && (
          <span
            className={`text-xs font-mono mb-1 ${
              trend === 'up' ? 'text-success' : 'text-red'
            }`}
          >
            {trend === 'up' ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline mr-0.5">
                <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline mr-0.5">
                <path d="M6 10L2 5H10L6 10Z" fill="currentColor" />
              </svg>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
