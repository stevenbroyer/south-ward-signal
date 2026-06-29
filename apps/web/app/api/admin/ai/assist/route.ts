import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { getAnthropic, AI_MODEL } from '@/lib/anthropic';
import {
  EDITOR_SYSTEM_PROMPT,
  titlePrompt,
  excerptPrompt,
  seoPrompt,
  tagsPrompt,
  rewritePrompt,
} from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type AssistAction = 'title' | 'excerpt' | 'seo' | 'tags' | 'rewrite';

interface AssistBody {
  action?: AssistAction;
  body?: string;
  title?: string;
  selection?: string;
  instruction?: string;
}

/** Best-effort JSON extraction from a model response (handles code fences). */
function extractJson<T>(text: string): T | null {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();
  try {
    return JSON.parse(t) as T;
  } catch {
    /* fall through */
  }
  const span = t.match(/[[{][\s\S]*[\]}]/);
  if (span) {
    try {
      return JSON.parse(span[0]) as T;
    } catch {
      /* give up */
    }
  }
  return null;
}

function cleanText(text: string): string {
  return text.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: AssistBody;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = payload;
  const body = (payload.body ?? '').toString();
  const title = (payload.title ?? '').toString();

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  // Build the user prompt + token budget per action.
  let prompt: string;
  let maxTokens = 1024;
  switch (action) {
    case 'title':
      if (!body.trim()) return NextResponse.json({ error: 'Write some body text first' }, { status: 400 });
      prompt = titlePrompt(body);
      break;
    case 'excerpt':
      if (!body.trim()) return NextResponse.json({ error: 'Write some body text first' }, { status: 400 });
      prompt = excerptPrompt(body, title);
      maxTokens = 400;
      break;
    case 'seo':
      if (!body.trim()) return NextResponse.json({ error: 'Write some body text first' }, { status: 400 });
      prompt = seoPrompt(body, title);
      break;
    case 'tags':
      if (!body.trim()) return NextResponse.json({ error: 'Write some body text first' }, { status: 400 });
      prompt = tagsPrompt(body, title);
      break;
    case 'rewrite': {
      const selection = (payload.selection ?? '').toString();
      if (!selection.trim()) return NextResponse.json({ error: 'No text selected to rewrite' }, { status: 400 });
      prompt = rewritePrompt(selection, payload.instruction ?? '', body);
      maxTokens = 4096;
      break;
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }

  let raw: string;
  try {
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system: EDITOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    raw = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  // Shape the result per action.
  switch (action) {
    case 'title': {
      const parsed = extractJson<{ titles?: string[] }>(raw);
      const titles = (parsed?.titles ?? []).map(cleanText).filter(Boolean);
      return NextResponse.json({ result: titles });
    }
    case 'tags': {
      const parsed = extractJson<{ tags?: string[] }>(raw);
      const tags = (parsed?.tags ?? [])
        .map((t) => cleanText(t).toLowerCase())
        .filter(Boolean);
      return NextResponse.json({ result: tags });
    }
    case 'seo': {
      const parsed = extractJson<{ seo_title?: string; seo_description?: string }>(raw);
      return NextResponse.json({
        result: {
          seo_title: cleanText(parsed?.seo_title ?? '').slice(0, 60),
          seo_description: cleanText(parsed?.seo_description ?? '').slice(0, 160),
        },
      });
    }
    case 'excerpt':
    case 'rewrite':
    default:
      return NextResponse.json({ result: cleanText(raw) });
  }
}
