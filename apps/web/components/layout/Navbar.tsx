'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/articles', label: 'Latest' },
  { href: '/data-room', label: 'Data Room' },
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 border-t-2 border-t-red transition-all duration-500',
          scrolled ? 'glass-strong border-b border-sws-600/30' : 'bg-bg',
        )}
      >
        <nav className="max-w-container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sws-logo.svg"
              alt="South Ward Signal"
              width={36}
              height={36}
              className="group-hover:drop-shadow-[0_0_8px_rgba(237,26,61,0.4)] transition-all duration-300"
            />
            <span className="font-display font-black text-sm sm:text-base text-sws-white tracking-tight">
              South Ward Signal
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} active={pathname?.startsWith(link.href)}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile — shadcn Sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] group"
                aria-label="Open navigation menu"
              >
                <span className="w-5 h-[1.5px] bg-sws-200 block transition-all group-hover:bg-sws-white group-hover:w-6" />
                <span className="w-5 h-[1.5px] bg-sws-200 block transition-all group-hover:bg-sws-white" />
                <span className="w-3.5 h-[1.5px] bg-sws-200 block transition-all group-hover:bg-sws-white group-hover:w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="!bg-[#0A0A0C] border-sws-600/30 w-[280px]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col pt-10">
                {/* Mobile nav links */}
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'block py-3 px-4 rounded-lg text-lg font-bold',
                        pathname?.startsWith(link.href)
                          ? 'text-[#ED1A3D]'
                          : 'text-[#F5F5F7]'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Divider + socials */}
                <div className="border-t border-sws-600/20 mt-8 pt-6 px-4">
                  <div className="flex gap-5">
                    <a
                      href="https://twitter.com/SouthWardSignal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-sws-500 hover:text-sws-white transition-colors uppercase tracking-wider"
                      aria-label="Follow on X (Twitter)"
                    >
                      X
                    </a>
                    <a
                      href="https://instagram.com/southwardsignal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-sws-500 hover:text-sws-white transition-colors uppercase tracking-wider"
                      aria-label="Follow on Instagram"
                    >
                      IG
                    </a>
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-[10px] font-mono text-sws-600 px-4 mt-auto pt-12 tracking-widest uppercase">
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
        'relative px-3 py-2 text-[13px] font-medium tracking-wide uppercase transition-colors duration-200',
        active ? 'text-sws-white' : 'text-sws-400 hover:text-sws-white'
      )}
    >
      {children}
      <span className={cn(
        'absolute bottom-0.5 left-3 right-3 h-[2px] bg-red rounded-full transition-all duration-300 ease-out',
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )} />
    </Link>
  );
}
