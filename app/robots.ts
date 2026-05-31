import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/marketing/site-url';

function siteHost() {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return 'tenvo.mindscapeanalytics.com';
  }
}

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/multi-business', '/business/', '/admin', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: siteHost(),
  };
}
