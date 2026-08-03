import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/marketing/seo';
import { getSiteUrl } from '@/lib/marketing/site-url';

export default function manifest(): MetadataRoute.Manifest {
  const site = getSiteUrl();
  return {
    name: `${SITE_NAME}: Business operations platform`,
    short_name: SITE_NAME,
    description:
      'Inventory, POS, storefront, orders, and accounting in one platform for growing businesses.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#0f766e',
    lang: 'en',
    dir: 'ltr',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/tenvo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    id: site,
  };
}
