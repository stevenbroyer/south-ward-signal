/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sws/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ghost.io' },
      { protocol: 'https', hostname: '**.ghost.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
