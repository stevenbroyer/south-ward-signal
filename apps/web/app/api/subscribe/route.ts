import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const ghostUrl = process.env.GHOST_URL;
    const adminKey = process.env.GHOST_ADMIN_API_KEY;

    if (!ghostUrl || !adminKey) {
      // Fallback: log and return success (for dev without Ghost)
      console.log(`[Subscribe] New subscriber (no Ghost configured): ${email}`);
      return NextResponse.json({ success: true, message: 'Successfully subscribed.' });
    }

    // Build Ghost Admin JWT
    const [id, secret] = adminKey.split(':');
    if (!id || !secret) {
      throw new Error('Invalid Ghost Admin API key format');
    }

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret, 'hex'))
      .update(`${header}.${payload}`)
      .digest('base64url');
    const token = `${header}.${payload}.${signature}`;

    // Create member via Ghost Admin API
    const res = await fetch(`${ghostUrl}/ghost/api/admin/members/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Ghost ${token}`,
      },
      body: JSON.stringify({ members: [{ email, labels: [{ name: 'Website Signup' }] }] }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      // Ghost returns 422 if member already exists
      if (res.status === 422) {
        return NextResponse.json({ success: true, message: 'You\'re already subscribed!' });
      }
      console.error('[Subscribe] Ghost API error:', res.status, errData);
      return NextResponse.json({ error: 'Subscription failed. Please try again.' }, { status: 500 });
    }

    console.log(`[Subscribe] New member created: ${email}`);
    return NextResponse.json({ success: true, message: 'Successfully subscribed.' });
  } catch (error) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
