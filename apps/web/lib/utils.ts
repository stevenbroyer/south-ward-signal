import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(parseISO(date), 'MMM d, yyyy');
}

export function formatDateShort(date: string) {
  return format(parseISO(date), 'MMM d');
}

export function timeAgo(date: string) {
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function formatMatchDate(date: string) {
  return format(parseISO(date), "EEEE, MMMM d 'at' h:mm a");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '...';
}

export function formatNumber(num: number, decimals = 0) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatStat(value: number, type: 'percentage' | 'decimal' | 'integer' = 'integer') {
  switch (type) {
    case 'percentage': return `${value}%`;
    case 'decimal': return value.toFixed(2);
    case 'integer': return Math.round(value).toString();
  }
}

export function getReadingTime(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / 250));
}
