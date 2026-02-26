import localFont from 'next/font/local';
import { Source_Sans_3, JetBrains_Mono } from 'next/font/google';

export const fraunces = localFont({
  src: '../public/fonts/Fraunces-Variable.woff2',
  variable: '--font-fraunces',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '700'],
});
