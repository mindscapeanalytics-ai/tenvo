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

/**
 * Decide whether next/image should bypass `/_next/image`.
 * On Vercel, Image Optimization is metered; when quota/billing blocks it the
 * optimizer returns 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED.
 *
 * Set NEXT_IMAGE_OPTIMIZATION=1 only after Vercel Usage shows Image Optimization
 * is available (Pro/paid overage), then redeploy so this config rebuilds.
 *
 * @returns {boolean}
 */
function resolveImagesUnoptimized() {
  const flag = String(process.env.NEXT_IMAGE_OPTIMIZATION || '').trim();
  if (flag === '1' || flag.toLowerCase() === 'true') return false;
  if (flag === '0' || flag.toLowerCase() === 'false') return true;
  // Local/dev: avoid optimizer timeouts on remote hosts.
  if (process.env.NODE_ENV !== 'production') return true;
  // Vercel sets VERCEL=1. Serve originals unless explicitly enabled above.
  if (process.env.VERCEL) return true;
  // Self-hosted Node production can use sharp-backed optimization.
  return false;
}

const imagesUnoptimized = resolveImagesUnoptimized();
if (process.env.VERCEL || process.env.NEXT_IMAGE_OPTIMIZATION) {
  console.info(
    `[next.config] images.unoptimized=${imagesUnoptimized}` +
      ` (NEXT_IMAGE_OPTIMIZATION=${process.env.NEXT_IMAGE_OPTIMIZATION || 'unset'})`
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
    // Default on Vercel: unoptimized (avoid 402 when quota is exhausted).
    // NEXT_IMAGE_OPTIMIZATION=1 → full /_next/image (requires working Vercel IO billing).
    unoptimized: imagesUnoptimized,
    // WebP only — AVIF+WebP doubles transformations/cost on Vercel Image Optimization.
    formats: ['image/webp'],
    // Tight allowlists cut unique transformation count (Vercel bills per transformation).
    qualities: [75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 31 days — Vercel guidance to reduce repeat transformations/cache writes.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = withBundleAnalyzer(nextConfig);
