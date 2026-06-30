import { NextRequest, NextResponse } from 'next/server';
import { isEmailConfigured, addSubscriber, sendEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function welcomeHtml(): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#0A0A0C;padding:24px;color:#fff;font-size:20px;font-weight:800;">South Ward <span style="color:#ED1A3D;">Signal</span></td></tr>
          <tr><td style="padding:28px 24px;color:#222;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 14px;">You're in. Welcome to the South Ward.</p>
            <p style="margin:0 0 14px;">You'll get our sharpest New York Red Bulls coverage — match recaps, tactical breakdowns, and the data nobody else bothers with.</p>
            <p style="margin:0;"><a href="${SITE_URL}/articles" style="color:#ED1A3D;font-weight:700;text-decoration:none;">Start reading →</a></p>
          </td></tr>
          <tr><td style="padding:16px 24px;background:#fafafa;color:#999;font-size:12px;border-top:1px solid #eee;">South Ward Signal · Independent, not affiliated with the New York Red Bulls or MLS.</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
    }
    const clean = email.trim().toLowerCase();

    if (!isEmailConfigured()) {
      // Not configured yet — accept gracefully so the form works in dev/preview.
      console.log(`[subscribe] (email not configured) ${clean}`);
      return NextResponse.json({ success: true, message: 'Thanks — you\'re on the list!' });
    }

    await addSubscriber(clean);
    try {
      await sendEmail({ to: clean, subject: 'Welcome to South Ward Signal', html: welcomeHtml() });
    } catch (err) {
      // Subscribed fine even if the welcome email hiccups.
      console.error('[subscribe] welcome email failed:', (err as Error).message);
    }

    return NextResponse.json({ success: true, message: 'Subscribed — check your inbox!' });
  } catch (err) {
    console.error('[subscribe] error:', err);
    return NextResponse.json({ error: 'Subscription failed. Please try again.' }, { status: 500 });
  }
}
