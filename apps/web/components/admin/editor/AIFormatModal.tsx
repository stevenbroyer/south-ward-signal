'use client';

import { useState } from 'react';
import { markdownToHtml } from '@/lib/markdown';
import { ARTICLE_TYPES } from '@/lib/article-types';

interface AIFormatModalProps {
  open: boolean;
  type: string;
  hasExistingBody: boolean;
  onClose: () => void;
  /** Receives the finished Markdown draft. */
  onInsert: (markdown: string) => void;
}

type Phase = 'input' | 'streaming' | 'done' | 'error';

export function AIFormatModal({
  open,
  type,
  hasExistingBody,
  onClose,
  onInsert,
}: AIFormatModalProps) {
  const [raw, setRaw] = useState('');
  const [draftType, setDraftType] = useState(type || 'match-recap');
  const [draft, setDraft] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [error, setError] = useState('');

  if (!open) return null;

  async function runFormat() {
    if (!raw.trim()) return;
    setPhase('streaming');
    setDraft('');
    setError('');

    try {
      const res = await fetch('/api/admin/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw, type: draftType }),
      });

      if (!res.ok || !res.body) {
        let message = 'Formatting failed.';
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          /* non-JSON error */
        }
        setError(message);
        setPhase('error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setDraft(acc);
      }
      setDraft(acc.trim());
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setPhase('error');
    }
  }

  function reset() {
    setPhase('input');
    setDraft('');
    setError('');
  }

  function useDraft() {
    onInsert(draft.trim());
    onClose();
    // reset for next time
    setRaw('');
    setDraft('');
    setPhase('input');
  }

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-sws-700/60 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sws-700/50">
          <div>
            <h2 className="font-display text-lg font-bold text-sws-white flex items-center gap-2">
              ✨ AI Draft Builder
            </h2>
            <p className="text-xs text-sws-400 mt-0.5">
              Paste your raw notes or rough draft — get clean, structured Markdown back. Your words, your voice.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sws-400 hover:text-sws-white transition-colors text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body: two panes (stacked on mobile, side-by-side on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-sws-700/40 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Input pane */}
          <div className="bg-bg-card flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-sws-700/40">
              <span className="text-xs font-mono text-sws-500 uppercase tracking-widest">Your raw text</span>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
                className="bg-bg-elevated border border-sws-700/50 rounded px-2 py-1 text-xs text-sws-300 focus:outline-none focus:border-red/50"
              >
                {ARTICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste your article text here — bullet points, rough paragraphs, stream of consciousness. Whatever you've got."
              className="flex-1 min-h-[300px] bg-bg-card px-4 py-3 text-sm text-sws-200 leading-relaxed focus:outline-none resize-none placeholder:text-sws-600"
            />
          </div>

          {/* Draft pane */}
          <div className="bg-bg-card flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-sws-700/40">
              <span className="text-xs font-mono text-sws-500 uppercase tracking-widest">
                {phase === 'streaming' ? 'Drafting…' : 'AI draft'}
              </span>
              {wordCount > 0 && (
                <span className="text-xs font-mono text-sws-600">{wordCount.toLocaleString()} words</span>
              )}
            </div>
            <div className="flex-1 min-h-[300px] overflow-y-auto px-5 py-4">
              {error ? (
                <div className="text-red text-sm">{error}</div>
              ) : draft ? (
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(draft) }}
                />
              ) : (
                <div className="text-sws-600 text-sm h-full flex items-center justify-center text-center">
                  {phase === 'streaming'
                    ? 'Thinking…'
                    : 'Your formatted draft will appear here.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-sws-700/50 flex-wrap">
          <div className="text-xs text-sws-500">
            {hasExistingBody && phase === 'done' && (
              <span className="text-yellow-500/90">⚠ Using this draft replaces the current body.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(phase === 'done' || phase === 'error') && (
              <button
                onClick={reset}
                className="px-4 py-2 text-sm text-sws-400 hover:text-sws-white transition-colors"
              >
                Start over
              </button>
            )}
            {phase === 'input' || phase === 'error' ? (
              <button
                onClick={runFormat}
                disabled={!raw.trim()}
                className="px-5 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
              >
                Format with AI
              </button>
            ) : phase === 'streaming' ? (
              <button
                disabled
                className="px-5 py-2 bg-red/60 text-white text-sm font-semibold rounded-lg cursor-wait"
              >
                Drafting…
              </button>
            ) : (
              <button
                onClick={useDraft}
                className="px-5 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors"
              >
                {hasExistingBody ? 'Replace body with draft' : 'Use this draft'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
