import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATION_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid revalidation secret.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { type, path, tag } = body as {
      type?: 'path' | 'tag';
      path?: string;
      tag?: string;
    };

    if (type === 'tag' && tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag });
    }

    if (type === 'path' && path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }

    // Default: revalidate articles pages
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
