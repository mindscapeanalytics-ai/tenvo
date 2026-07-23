/** @type {import('next').NextConfig} */
const path = require('path');
const { remotePatterns: storefrontImageRemotePatterns } = require('./lib/storefront/allowedImageHosts.json');

/** Next.js caps `images.remotePatterns` at 50 entries (invalid-next-config). */
const NEXT_IMAGES_REMOTE_PATTERNS_MAX = 50;

if (!Array.isArray(storefrontImageRemotePatterns)) {
  throw new Error('allowedImageHosts.json remotePatterns must be an array');
}
if (storefrontImageRemotePatterns.length > NEXT_IMAGES_REMOTE_PATTERNS_MAX) {
  throw new Error(
    `allowedImageHosts.json has ${storefrontImageRemotePatterns.length} remotePatterns; ` +
      `Next.js allows at most ${NEXT_IMAGES_REMOTE_PATTERNS_MAX}. Consolidate with **.host wildcards.`
  );
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@radix-ui/react-icons',
      'framer-motion',
    ],
  },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/tenvo.svg', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      {
        source: '/humans.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
    ];
  },
  images: {
    // Shared allowlist — also enforced at runtime in SmartProductImage
    // (lib/storefront/allowedImageHosts.json) so unknown hosts never throw Invalid src.
    remotePatterns: storefrontImageRemotePatterns,
    // Keep unoptimized in development to avoid 504/500 when optimizing remote images locally.
    // Production uses Next image optimization (WebP/AVIF) for LCP.
    unoptimized: process.env.NODE_ENV !== 'production',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = withBundleAnalyzer(nextConfig);
