import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { getAnthropic, AI_MODEL } from '@/lib/anthropic';
import { EDITOR_SYSTEM_PROMPT, formatPrompt } from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** POST — stream a cleaned Markdown draft from raw pasted text. */
export async function POST(request: NextRequest) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { text?: string; type?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = (payload.text ?? '').toString();
  const type = (payload.type ?? '').toString();
  if (!text.trim()) {
    return NextResponse.json({ error: 'No text to format' }, { status: 400 });
  }

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const llm = anthropic.messages.stream({
          model: AI_MODEL,
          max_tokens: 16000,
          system: EDITOR_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: formatPrompt(text, type) }],
        });

        for await (const event of llm) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        // Surface the error inline so the client can show it in the draft pane.
        controller.enqueue(
          encoder.encode(`\n\n[AI error: ${(err as Error).message}]`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
