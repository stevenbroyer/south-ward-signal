/**
 * Email via Resend (REST, no SDK dependency). Subscribers live in a Resend
 * Audience, so no DB table is needed. Everything no-ops gracefully until
 * RESEND_API_KEY (+ RESEND_AUDIENCE_ID for the list) are configured.
 */

const RESEND_API = 'https://api.resend.com';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return process.env.RESEND_FROM ?? 'South Ward Signal <news@southwardsignal.com>';
}

async function resend(path: string, body: unknown, method = 'POST'): Promise<any> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch(`${RESEND_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error?.message || `Resend ${res.status}`);
  return data;
}

export async function sendEmail(opts: { to: string | string[]; subject: string; html: string }): Promise<void> {
  await resend('/emails', { from: fromAddress(), to: opts.to, subject: opts.subject, html: opts.html });
}

/** Add a subscriber to the Resend audience. Returns false if not configured. */
export async function addSubscriber(email: string): Promise<boolean> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!process.env.RESEND_API_KEY || !audienceId) return false;
  try {
    await resend(`/audiences/${audienceId}/contacts`, { email, unsubscribed: false });
  } catch (err) {
    // Already-subscribed is fine; rethrow anything else.
    const msg = (err as Error).message.toLowerCase();
    if (!msg.includes('already') && !msg.includes('exists')) throw err;
  }
  return true;
}

/** Send a broadcast to the whole audience (used by the weekly digest). */
export async function sendBroadcastToAudience(opts: { subject: string; html: string }): Promise<string> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID is not set');
  const created = await resend('/broadcasts', {
    audience_id: audienceId,
    from: fromAddress(),
    subject: opts.subject,
    html: opts.html,
  });
  await resend(`/broadcasts/${created.id}/send`, {});
  return created.id;
}
