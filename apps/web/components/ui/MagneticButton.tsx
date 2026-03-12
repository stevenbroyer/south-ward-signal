'use client';

import { useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import Link from 'next/link';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function MagneticButton({
  children,
  className = '',
  href,
  onClick,
  type = 'button',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const maxDist = 20;
    const clampedX = Math.max(-maxDist, Math.min(maxDist, distX * 0.3));
    const clampedY = Math.max(-maxDist, Math.min(maxDist, distY * 0.3));
    x.set(clampedX);
    y.set(clampedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const baseClass = `relative inline-flex items-center justify-center cursor-pointer ${className}`;

  const inner = (
    <motion.div
      ref={ref}
      className={baseClass}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return (
    <button type={type} onClick={onClick} className="appearance-none border-0 bg-transparent p-0">
      {inner}
    </button>
  );
}
