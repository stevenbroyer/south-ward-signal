import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

marked.setOptions({ gfm: true, breaks: false });

let turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
    });
    turndown.use(gfm);
  }
  return turndown;
}

/** Markdown → HTML (used to seed the WYSIWYG editor and render previews). */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  return marked.parse(md, { async: false }) as string;
}

/** HTML (from the WYSIWYG editor) → Markdown (the stored source of truth). */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return getTurndown().turndown(html).trim();
}
