import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get('limit') || '6';
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return Response.json([]);
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp,media_type&limit=${limit}&access_token=${token}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) return Response.json([]);

    const data = await res.json();
    return Response.json(data.data || []);
  } catch {
    return Response.json([]);
  }
}
