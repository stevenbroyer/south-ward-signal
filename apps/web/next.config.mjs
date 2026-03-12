/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sws/shared'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.ghost.io' },
      { protocol: 'https', hostname: '**.ghost.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.sofascore.com' },
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'tmssl.akamaized.net' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'date-fns'],
    viewTransition: true,
  },
};

export default nextConfig;
