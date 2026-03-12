'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { m } from 'motion/react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/articles', label: 'Latest' },
  { href: '/data-room', label: 'Data Room' },
  { href: '/community', label: 'Community' },
  { href: '/social', label: 'Social' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Red accent line at very top */}
      <m.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-red z-[60]"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      <header
        className={cn(
          'fixed top-[2px] left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'glass-strong border-b border-sws-600/50' : 'bg-transparent',
        )}
      >
        <nav className="max-w-container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/images/rbny-crest.png"
              alt="New York Red Bulls"
              width={32}
              height={27}
              className="group-hover:drop-shadow-[0_0_6px_rgba(237,26,61,0.5)] transition-all duration-300"
            />
            <span className="font-display font-bold text-lg text-sws-white hidden sm:block">
              South Ward Signal
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} active={pathname?.startsWith(link.href)}>
                {link.label}
              </NavLink>
            ))}
            <Link
              href="/newsletter"
              className="px-4 py-2 bg-red text-white text-sm font-semibold rounded hover:bg-accent transition-colors duration-200"
            >
              Subscribe
            </Link>
          </div>

          {/* Mobile — shadcn Sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                aria-label="Open navigation menu"
              >
                <span className="w-5 h-[2px] bg-sws-white block" />
                <span className="w-5 h-[2px] bg-sws-white block" />
                <span className="w-5 h-[2px] bg-sws-white block" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-bg border-sws-600 w-[300px]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col gap-6 pt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'text-2xl font-display font-bold transition-colors',
                      pathname?.startsWith(link.href) ? 'text-red' : 'text-sws-white hover:text-red'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-sws-600 pt-6 mt-2">
                  <Link
                    href="/newsletter"
                    className="inline-block px-6 py-3 bg-red text-white font-semibold rounded text-lg w-full text-center hover:bg-accent transition-colors"
                  >
                    Subscribe Free
                  </Link>
                </div>
                <div className="flex gap-6 mt-4">
                  <a
                    href="https://twitter.com/SouthWardSignal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sws-400 hover:text-sws-white transition-colors"
                    aria-label="Follow on X (Twitter)"
                  >
                    X / Twitter
                  </a>
                  <a
                    href="https://instagram.com/southwardsignal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sws-400 hover:text-sws-white transition-colors"
                    aria-label="Follow on Instagram"
                  >
                    Instagram
                  </a>
                </div>
                <p className="text-xs text-sws-500 mt-auto pt-8">
                  Data-driven. Supporter-born.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>
    </>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'relative group text-sm font-medium transition-colors duration-200',
        active ? 'text-sws-white' : 'text-sws-300 hover:text-sws-white'
      )}
    >
      {children}
      <span className={cn(
        'absolute -bottom-1 left-0 h-[2px] bg-red transition-all duration-300 ease-out',
        active ? 'w-full' : 'w-0 group-hover:w-full'
      )} />
    </Link>
  );
}
