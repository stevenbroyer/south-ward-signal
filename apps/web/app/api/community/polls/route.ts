import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('[community/polls] Received:', body);
  return NextResponse.json({ success: true });
}
