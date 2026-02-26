export const brand = {
  name: 'South Ward Signal',
  tagline: 'Data-driven. Supporter-born.',
  description: 'Independent, AI-powered coverage of the New York Red Bulls.',

  colors: {
    bg: '#0A0A0C',
    bgCard: '#111114',
    bgElevated: '#18181C',
    red: '#ED1A3D',
    redGlow: 'rgba(237, 26, 61, 0.15)',
    redMuted: 'rgba(237, 26, 61, 0.6)',
    accent: '#FF4D6A',
    gold: '#D4A843',
    white: '#F5F5F7',
    gray: {
      100: '#E8E8EC',
      200: '#C8C8D0',
      300: '#A0A0AC',
      400: '#6E6E7A',
      500: '#44444F',
      600: '#2A2A32',
      700: '#1E1E24',
    },
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  fonts: {
    display: "'Fraunces', serif",
    body: "'Source Sans 3', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  fontWeights: {
    displayBlack: 900,
    displayBold: 700,
    bodyRegular: 400,
    bodyLight: 300,
    monoRegular: 400,
    monoBold: 700,
  },

  spacing: {
    section: '120px',
    sectionMobile: '80px',
    container: '1280px',
    containerNarrow: '960px',
  },

  animation: {
    duration: {
      fast: 0.2,
      normal: 0.4,
      slow: 0.8,
      reveal: 1.2,
    },
    easing: {
      smooth: [0.22, 1, 0.36, 1],
      bounce: [0.68, -0.55, 0.265, 1.55],
      snap: [0.77, 0, 0.175, 1],
    },
  },
} as const;

export type BrandColors = typeof brand.colors;
export type BrandFonts = typeof brand.fonts;
