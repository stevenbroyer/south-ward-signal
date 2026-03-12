'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/articles', label: 'Latest' },
  { href: '/data-room', label: 'Data Room' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Red accent line at very top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-red z-[60]"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.header
        className={cn(
          'fixed top-[2px] left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'glass-strong border-b border-sws-600/50' : 'bg-transparent',
        )}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="max-w-container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-red flex items-center justify-center font-display font-black text-sm text-white group-hover:glow-red-strong transition-shadow duration-300">
              SW
            </div>
            <span className="font-display font-bold text-lg text-sws-white hidden sm:block">
              South Ward Signal
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            <Link
              href="/#subscribe"
              className="px-4 py-2 bg-red text-white text-sm font-semibold rounded hover:bg-accent transition-colors duration-200"
            >
              Subscribe
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <motion.span
              className="w-5 h-[2px] bg-sws-white block"
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 5 : 0 }}
            />
            <motion.span
              className="w-5 h-[2px] bg-sws-white block"
              animate={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <motion.span
              className="w-5 h-[2px] bg-sws-white block"
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -5 : 0 }}
            />
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 glass-strong pt-24 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-3xl font-display font-bold text-sws-white hover:text-red transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  href="/#subscribe"
                  onClick={() => setMobileOpen(false)}
                  className="inline-block mt-4 px-6 py-3 bg-red text-white font-semibold rounded text-lg"
                >
                  Subscribe Free
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative group text-sm font-medium text-sws-300 hover:text-sws-white transition-colors duration-200">
      {children}
      <span className="absolute -bottom-1 left-0 h-[2px] bg-red w-0 group-hover:w-full transition-all duration-300 ease-out" />
    </Link>
  );
}
