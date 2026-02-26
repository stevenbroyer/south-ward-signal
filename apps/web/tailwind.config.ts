import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0C',
          card: '#111114',
          elevated: '#18181C',
        },
        red: {
          DEFAULT: '#ED1A3D',
          glow: 'rgba(237, 26, 61, 0.15)',
          muted: 'rgba(237, 26, 61, 0.6)',
        },
        accent: '#FF4D6A',
        gold: '#D4A843',
        sws: {
          white: '#F5F5F7',
          100: '#E8E8EC',
          200: '#C8C8D0',
          300: '#A0A0AC',
          400: '#6E6E7A',
          500: '#44444F',
          600: '#2A2A32',
          700: '#1E1E24',
        },
        success: '#22C55E',
      },
      fontFamily: {
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
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #ED1A3D 0%, #FF4D6A 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0C 0%, #111114 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
