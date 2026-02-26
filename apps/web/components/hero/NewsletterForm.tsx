'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to subscribe');
      setStatus('success');
      setEmail('');
    } catch {
      setErrorMsg('Something went wrong. Try again.');
      setStatus('error');
    }
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 py-3"
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <motion.path
                  d="M3 8.5L6.5 12L13 4"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />
              </svg>
            </motion.div>
            <span className="text-sm text-success font-medium">
              You&apos;re in. Check your inbox.
            </span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-bg-elevated border border-sws-600 rounded text-sm text-sws-white placeholder:text-sws-500 focus:outline-none focus:border-red/50 focus:ring-1 focus:ring-red/20 transition-all font-mono"
              />
            </div>
            <motion.button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-red text-white text-sm font-bold rounded hover:bg-accent disabled:opacity-50 transition-colors whitespace-nowrap"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Joining...
                </span>
              ) : (
                'Subscribe Free'
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {status === 'error' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-accent mt-2"
        >
          {errorMsg}
        </motion.p>
      )}

      <p className="text-[11px] text-sws-500 mt-3">
        Free newsletter. Match recaps + data drops. No spam, unsubscribe anytime.
      </p>
    </div>
  );
}
