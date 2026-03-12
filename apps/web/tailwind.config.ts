import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── shadcn/ui semantic tokens (CSS variable-driven) ── */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          pink: '#FF4D6A',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        /* ── Brand palette ── */
        bg: {
          DEFAULT: '#0A0A0C',
          card: '#111114',
          elevated: '#18181C',
          surface: '#1F1F25',
        },
        red: {
          DEFAULT: '#ED1A3D',
          glow: 'rgba(237, 26, 61, 0.15)',
          muted: 'rgba(237, 26, 61, 0.6)',
        },
        gold: '#D4A843',
        blue: {
          DEFAULT: '#557AB2',
          muted: 'rgba(85, 122, 178, 0.15)',
        },
        sws: {
          white: '#F5F5F7',
          100: '#E8E8EC',
          200: '#C8C8D0',
          300: '#A0A0AC',
          400: '#7F7F8B',
          500: '#5D5D6B',
          600: '#2A2A32',
          700: '#1E1E24',
        },
        success: '#22C55E',
        warning: '#F59E0B',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-source-sans)', ...fontFamily.sans],
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-source-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      maxWidth: {
        container: '1280px',
        narrow: '960px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'line-draw': 'line-draw 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'counter-up': 'counter-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'line-draw': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #ED1A3D 0%, #FF4D6A 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0C 0%, #111114 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
