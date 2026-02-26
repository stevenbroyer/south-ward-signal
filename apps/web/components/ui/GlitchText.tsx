'use client';

import { useState } from 'react';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GlitchText({ children, className = '' }: GlitchTextProps) {
  const [active, setActive] = useState(false);

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {/* Base text */}
      <span className="relative z-10">{children}</span>

      {/* Red channel offset */}
      <span
        aria-hidden
        className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-100"
        style={{
          color: '#ED1A3D',
          opacity: active ? 0.8 : 0,
          clipPath: active
            ? 'inset(15% 0 35% 0)'
            : 'inset(50% 0 50% 0)',
          transform: active ? 'translate(2px, -1px)' : 'translate(0, 0)',
          transition: 'clip-path 0.15s ease, transform 0.15s ease, opacity 0.1s ease',
        }}
      >
        {children}
      </span>

      {/* Blue channel offset */}
      <span
        aria-hidden
        className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-100"
        style={{
          color: '#3B82F6',
          opacity: active ? 0.6 : 0,
          clipPath: active
            ? 'inset(55% 0 5% 0)'
            : 'inset(50% 0 50% 0)',
          transform: active ? 'translate(-2px, 1px)' : 'translate(0, 0)',
          transition: 'clip-path 0.15s ease, transform 0.15s ease, opacity 0.1s ease',
        }}
      >
        {children}
      </span>
    </span>
  );
}
