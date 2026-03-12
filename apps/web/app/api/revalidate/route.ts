import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const secret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATION_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid revalidation secret.' },
        { status: 401 },
      );
    }

    // Ghost webhook: revalidate ghost-posts cache tag immediately
    const contentType = request.headers.get('content-type') || '';
    if (
      request.headers.has('x-webhook-secret') ||
      contentType.includes('application/json')
    ) {
      let body: Record<string, unknown> = {};
      try {
        body = await request.json();
      } catch {
        // Ghost may send empty body on some webhook events
      }

      const { type, path, tag } = body as {
        type?: 'path' | 'tag';
        path?: string;
        tag?: string;
      };

      // Explicit tag revalidation
      if (type === 'tag' && tag) {
        revalidateTag(tag, { expire: 0 });
        return NextResponse.json({ revalidated: true, tag, now: Date.now() });
      }

      // Explicit path revalidation
      if (type === 'path' && path) {
        revalidatePath(path);
        return NextResponse.json({ revalidated: true, path, now: Date.now() });
      }

      // Default: Ghost webhook or untyped request — revalidate ghost content
      revalidateTag('ghost-posts', { expire: 0 });
      revalidatePath('/articles');
      revalidatePath('/');
      return NextResponse.json({
        revalidated: true,
        tags: ['ghost-posts'],
        paths: ['/articles', '/'],
        now: Date.now(),
      });
    }

    // Fallback for non-JSON requests
    revalidatePath('/articles');
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, paths: ['/articles', '/'] });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed.' },
      { status: 500 },
    );
  }
}
