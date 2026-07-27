import Image from 'next/image';
import { resolveImageReferrerPolicy } from '@/lib/storefront/imageReferrerPolicy';

/**
 * Marketing next/image wrapper.
 * Pre-optimized /public WebP (tenvo-img) skips Vercel transformations to save quota;
 * remote CDN URLs use no-referrer (avoids Cloudflare hotlink 403) and still go through
 * /_next/image when NEXT_IMAGE_OPTIMIZATION=1.
 */
function isLocalPublicSrc(src) {
  return typeof src === 'string' && src.startsWith('/') && !src.startsWith('//');
}

export default function MarketingImage({ src, unoptimized, referrerPolicy, ...props }) {
  return (
    <Image
      src={src}
      unoptimized={unoptimized ?? isLocalPublicSrc(src)}
      referrerPolicy={referrerPolicy ?? resolveImageReferrerPolicy(src)}
      {...props}
    />
  );
}
