'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GridBackgroundProps {
  className?: string;
}

export function GridBackground({ className = '' }: GridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: { x: number; y: number; vy: number; opacity: number; size: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function initParticles() {
      if (!canvas) return;
      particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: -(0.15 + Math.random() * 0.3),
        opacity: Math.random() * 0.3,
        size: 1 + Math.random() * 1.5,
      }));
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = 60;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(237, 26, 61, 0.03)';
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw glow at intersections
      for (let x = 0; x <= canvas.width; x += spacing) {
        for (let y = 0; y <= canvas.height; y += spacing) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 3);
          glow.addColorStop(0, 'rgba(237, 26, 61, 0.06)');
          glow.addColorStop(1, 'rgba(237, 26, 61, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
      }

      // Animate particles drifting upward
      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(237, 26, 61, ${p.opacity * 0.15})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', () => { resize(); initParticles(); });
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
      style={{ zIndex: 0 }}
    />
  );
}
