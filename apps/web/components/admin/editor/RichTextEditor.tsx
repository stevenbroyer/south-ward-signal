'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { markdownToHtml, htmlToMarkdown } from '@/lib/markdown';

interface RichTextEditorProps {
  /** Body as Markdown (the stored source of truth). */
  value: string;
  /** Called with fresh Markdown whenever the document changes. */
  onChange: (markdown: string) => void;
  placeholder?: string;
  /** Optional AI rewrite of the current selection; return the new text or null. */
  onRewriteRequest?: (selectedText: string) => Promise<string | null>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  onRewriteRequest,
}: RichTextEditorProps) {
  // Tracks the markdown we last emitted/received so external updates (AI drafts)
  // can be distinguished from the user's own typing — prevents update loops.
  const lastMarkdown = useRef<string>(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Write your article…' }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: 'article-content focus:outline-none min-h-[440px] px-5 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      const md = htmlToMarkdown(editor.getHTML());
      lastMarkdown.current = md;
      onChange(md);
    },
  });

  // Push external value changes (loaded article, AI-generated draft) into the editor.
  useEffect(() => {
    if (!editor) return;
    if (value !== lastMarkdown.current) {
      lastMarkdown.current = value;
      editor.commands.setContent(markdownToHtml(value), false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="border border-sws-700/50 rounded-lg min-h-[500px] bg-bg-elevated animate-pulse" />
    );
  }

  return (
    <div className="sws-editor border border-sws-700/50 rounded-lg bg-bg-elevated focus-within:border-red/50 transition-colors overflow-hidden">
      <Toolbar editor={editor} onRewriteRequest={onRewriteRequest} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  onRewriteRequest,
}: {
  editor: Editor;
  onRewriteRequest?: (selectedText: string) => Promise<string | null>;
}) {
  const [rewriting, setRewriting] = useState(false);
  const [, force] = useState(0);

  // Re-render the toolbar when selection / active marks change.
  useEffect(() => {
    const update = () => force((n) => n + 1);
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const hasSelection = !editor.state.selection.empty;

  async function handleRewrite() {
    if (!onRewriteRequest || rewriting) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, ' ').trim();
    if (!selected) return;
    setRewriting(true);
    try {
      const result = await onRewriteRequest(selected);
      if (result) {
        editor.chain().focus().deleteSelection().insertContent(result).run();
      }
    } finally {
      setRewriting(false);
    }
  }

  function toggleLink() {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-sws-700/50 bg-bg-card/60 sticky top-0 z-10">
      <Btn label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Btn>
      <Btn label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Btn>
      <Btn label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Btn>

      <Divider />

      <Btn label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>

      <Divider />

      <Btn label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •
      </Btn>
      <Btn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </Btn>
      <Btn label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </Btn>
      <Btn label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <span className="font-mono">{'</>'}</span>
      </Btn>
      <Btn label="Divider" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ―
      </Btn>

      <Divider />

      <Btn label="Link" active={editor.isActive('link')} onClick={toggleLink}>
        🔗
      </Btn>

      <Divider />

      <Btn label="Undo" active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </Btn>
      <Btn label="Redo" active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </Btn>

      {onRewriteRequest && (
        <button
          type="button"
          onClick={handleRewrite}
          disabled={!hasSelection || rewriting}
          title={hasSelection ? 'Rewrite the selected text with AI' : 'Select text to rewrite with AI'}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded border border-red/30 text-red/90 hover:bg-red/10 hover:border-red/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {rewriting ? 'Rewriting…' : '✨ AI rewrite'}
        </button>
      )}
    </div>
  );
}

function Btn({
  children,
  label,
  active,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-red/15 text-red'
          : 'text-sws-300 hover:text-sws-white hover:bg-bg-elevated'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-sws-700/50 mx-1" aria-hidden />;
}
