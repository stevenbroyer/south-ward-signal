'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 400, mass: 0.5 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show on desktop
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      setIsVisible(true);
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[data-hoverable]') ||
        target.tagName === 'A' ||
        target.tagName === 'BUTTON'
      ) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => setIsHovering(false);

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[100] mix-blend-difference"
        style={{ x, y }}
      >
        <motion.div
          className="rounded-full bg-red -translate-x-1/2 -translate-y-1/2"
          animate={{
            width: isHovering ? 40 : 8,
            height: isHovering ? 40 : 8,
            backgroundColor: isHovering ? 'rgba(237, 26, 61, 0.2)' : '#ED1A3D',
            borderWidth: isHovering ? 2 : 0,
            borderColor: '#ED1A3D',
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ borderStyle: 'solid' }}
        />
      </motion.div>
    </>
  );
}
