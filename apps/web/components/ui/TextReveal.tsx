'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface TextRevealProps {
  text: string;
  mode?: 'word' | 'char';
  delay?: number;
  stagger?: number;
  className?: string;
}

export function TextReveal({
  text,
  mode = 'word',
  delay = 0,
  stagger = 0.08,
  className = '',
}: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const units = mode === 'word' ? text.split(' ') : text.split('');

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {units.map((unit, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className="inline-block"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={
              isInView
                ? { clipPath: 'inset(0 0% 0 0)' }
                : { clipPath: 'inset(0 100% 0 0)' }
            }
            transition={{
              duration: 0.5,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {unit}
            {mode === 'word' && i < units.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
