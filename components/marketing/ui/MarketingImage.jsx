import Image from 'next/image';

/**
 * Marketing next/image wrapper.
 * Pre-optimized /public WebP (tenvo-img) skips Vercel transformations to save quota;
 * remote CDN URLs still go through /_next/image when NEXT_IMAGE_OPTIMIZATION=1.
 */
function isLocalPublicSrc(src) {
  return typeof src === 'string' && src.startsWith('/') && !src.startsWith('//');
}

export default function MarketingImage({ src, unoptimized, ...props }) {
  return (
    <Image
      src={src}
      unoptimized={unoptimized ?? isLocalPublicSrc(src)}
      {...props}
    />
  );
}
