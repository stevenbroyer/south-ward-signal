import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** PATCH — update a user's password and/or email. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: { password?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: { password?: string; email?: string } = {};

  if (body.password !== undefined) {
    if (body.password.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD} characters` },
        { status: 400 },
      );
    }
    updates.password = body.password;
  }

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.updateUserById(id, updates);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}

/** DELETE — remove a user (cannot delete yourself or the last remaining admin). */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  // Look up the target so we can guard against self-deletion.
  const { data: target, error: getErr } = await db.auth.admin.getUserById(id);
  if (getErr || !target.user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if ((target.user.email ?? '').toLowerCase() === user.email.toLowerCase()) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  // Don't allow removing the last remaining admin.
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const adminCount = (list?.users ?? []).filter(
    (u) => (u.app_metadata as { role?: string } | undefined)?.role === 'admin',
  ).length;
  if (adminCount <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 });
  }

  const { error } = await db.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
