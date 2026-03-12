'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  html: string;
}

export function TableOfContents({ html }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Parse headings from HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');

    const tocItems: TocItem[] = Array.from(headings).map((heading, i) => {
      const id = heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `heading-${i}`;
      return {
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      };
    });

    setItems(tocItems);
  }, [html]);

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav className="hidden xl:block" aria-label="Table of contents">
      <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-4">Contents</p>
      <ul className="space-y-2 border-l border-sws-600">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block text-sm py-1 transition-colors border-l-2 -ml-[1px] ${
                item.level === 3 ? 'pl-6' : 'pl-4'
              } ${
                activeId === item.id
                  ? 'text-sws-white border-red'
                  : 'text-sws-400 border-transparent hover:text-sws-200 hover:border-sws-400'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
