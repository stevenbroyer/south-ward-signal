/** Canonical site URL + name, used by sitemap, RSS, JSON-LD, and emails. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://southwardsignal.com').replace(/\/$/, '');
export const SITE_NAME = 'South Ward Signal';
export const SITE_DESCRIPTION =
  'Independent, data-driven coverage of the New York Red Bulls — match recaps, tactical breakdowns, and advanced analytics.';
export const SITE_TWITTER = 'https://x.com/SouthWardSignal';
