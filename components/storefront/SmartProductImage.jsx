'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { resolveBrandMonogramUrl } from '@/lib/storefront/storefrontImagePlaceholders';
import { isDeadImageUrl } from '@/lib/storefront/deadImageHosts';
import { normalizeStorefrontRemoteImageUrl } from '@/lib/storefront/productImageFallback';
import { isAllowedNextImageSrc } from '@/lib/storefront/allowedImageHosts';
import { resolveImageReferrerPolicy } from '@/lib/storefront/imageReferrerPolicy';
import {
  inferImageVariantFromWidth,
  inferImageVariantFromSizes,
  resolveStorefrontImageSrc,
  shouldUseDirectCdnImage,
  buildSupabaseObjectPublicUrl,
} from '@/lib/storefront/supabaseImageUrl';

/**
 * Renders storefront product imagery.
 * Local /public paths and Supabase URLs use plain img (CDN / static).
 * Allowlisted HTTPS may use next/image; unknown remotes use plain img so
 * next/image never throws Invalid src. On Vercel, next.config sets
 * images.unoptimized unless NEXT_IMAGE_OPTIMIZATION=1 (paid add-on).
 */
export function SmartProductImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  style,
  priority,
  fallbackSrc,
  placeholderLabel,
  imageVariant,
}) {
  const safeSrc = isDeadImageUrl(src)
    ? ''
    : normalizeStorefrontRemoteImageUrl(src || '');
  const safeFallback =
    fallbackSrc && !isDeadImageUrl(fallbackSrc)
      ? normalizeStorefrontRemoteImageUrl(fallbackSrc)
      : '';
  const [currentSrc, setCurrentSrc] = useState(safeSrc || safeFallback);
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [useObjectPublicFallback, setUseObjectPublicFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(safeSrc || safeFallback);
    setFailed(false);
    setFallbackFailed(false);
    setUseObjectPublicFallback(false);
  }, [safeSrc, safeFallback]);

  // Prefer primary; if empty or failed, use fallback immediately (category tiles often have no src).
  const activeSrc =
    failed || !currentSrc
      ? safeFallback && !fallbackFailed
        ? safeFallback
        : ''
      : currentSrc;
  const monogramLabel = placeholderLabel || alt || '';
  const monogramSrc =
    monogramLabel && !activeSrc
      ? resolveBrandMonogramUrl(monogramLabel)
      : '';

  const handleError = () => {
    if (
      shouldUseDirectCdnImage(currentSrc || activeSrc) &&
      !useObjectPublicFallback &&
      !failed
    ) {
      setUseObjectPublicFallback(true);
      return;
    }
    if (safeFallback && !failed) {
      setFailed(true);
      return;
    }
    if (safeFallback && failed && !fallbackFailed) {
      setFallbackFailed(true);
      setCurrentSrc('');
      return;
    }
    setCurrentSrc('');
  };

  if (!activeSrc && !monogramSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-neutral-100 text-neutral-400',
          fill && 'absolute inset-0 h-full w-full',
          className
        )}
        style={style}
        aria-hidden={!alt}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide">
          {(placeholderLabel || alt || 'Image').slice(0, 3)}
        </span>
      </div>
    );
  }

  const renderSrc = activeSrc || monogramSrc;
  const isDataUrl = renderSrc.startsWith('data:');
  const isSvg = /\.svg(\?|$)/i.test(renderSrc);

  // Default fill/crop; callers may pass object-contain (etc.) and twMerge wins.
  const fitClass = 'object-cover';

  const renderPlainImg = (imgSrc) => {
    const refPolicy = resolveImageReferrerPolicy(imgSrc);
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={alt || ''}
          className={cn('absolute inset-0 h-full w-full', fitClass, className)}
          style={style}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy={refPolicy}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={alt || ''}
        width={width || 400}
        height={height || 400}
        className={cn(fitClass, className)}
        style={style}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy={refPolicy}
      />
    );
  };

  // Data URLs, SVGs, and same-origin /public assets: serve directly.
  // Avoids Vercel `/_next/image` 402 when Image Optimization is unpaid, and
  // skips double-encoding of pre-optimized WebP under /tenvo-img/webp.
  const isLocalPublicPath = renderSrc.startsWith('/') && !renderSrc.startsWith('//');
  if (isDataUrl || isSvg || isLocalPublicPath) {
    return renderPlainImg(renderSrc);
  }

  const variant =
    imageVariant ||
    inferImageVariantFromSizes(sizes) ||
    inferImageVariantFromWidth(width || (fill ? 512 : undefined));
  const cdnSrc = useObjectPublicFallback
    ? buildSupabaseObjectPublicUrl(renderSrc)
    : resolveStorefrontImageSrc(renderSrc, { variant });
  const useDirectCdn = shouldUseDirectCdnImage(renderSrc);

  if (useDirectCdn) {
    return renderPlainImg(cdnSrc);
  }

  // Unknown remotes: plain <img> — next/image throws Invalid src when host is not allowlisted.
  if (!isAllowedNextImageSrc(renderSrc)) {
    return renderPlainImg(renderSrc);
  }

  if (fill) {
    return (
      <Image
        src={renderSrc}
        alt={alt || ''}
        fill
        className={cn(fitClass, className)}
        sizes={sizes || '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
        style={style}
        priority={priority}
        onError={handleError}
        referrerPolicy={resolveImageReferrerPolicy(renderSrc)}
      />
    );
  }

  return (
    <Image
      src={renderSrc}
      alt={alt || ''}
      width={width || 400}
      height={height || 400}
      className={cn(fitClass, className)}
      sizes={sizes}
      style={style}
      priority={priority}
      onError={handleError}
      referrerPolicy={resolveImageReferrerPolicy(renderSrc)}
    />
  );
}
