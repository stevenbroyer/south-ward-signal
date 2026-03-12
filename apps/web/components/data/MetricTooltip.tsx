'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

interface MetricTooltipProps {
  metricKey: string;
  children: React.ReactNode;
}

export function MetricTooltip({ metricKey, children }: MetricTooltipProps) {
  const definition = getMetricDefinition(metricKey);

  if (!definition) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-sws-500/50 hover:border-sws-300 transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-bg-elevated border border-sws-600 p-4 rounded-lg shadow-lg z-50"
        >
          <p className="font-display font-bold text-sm text-sws-white mb-1">
            {definition.name}
          </p>
          <p className="text-xs text-sws-300 leading-relaxed">
            {definition.description}
          </p>
          {definition.example && (
            <p className="text-xs text-sws-400 mt-2 italic">
              {definition.example}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
