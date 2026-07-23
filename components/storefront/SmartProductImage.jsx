'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { resolveBrandMonogramUrl } from '@/lib/storefront/storefrontImagePlaceholders';
import { isDeadImageUrl } from '@/lib/storefront/deadImageHosts';
import { normalizeStorefrontRemoteImageUrl } from '@/lib/storefront/productImageFallback';
import { isAllowedNextImageSrc } from '@/lib/storefront/allowedImageHosts';
import {
  inferImageVariantFromWidth,
  resolveStorefrontImageSrc,
  shouldUseDirectCdnImage,
  buildSupabaseObjectPublicUrl,
} from '@/lib/storefront/supabaseImageUrl';

/**
 * Renders storefront product imagery.
 * Supabase URLs use CDN transforms (plain img); allowlisted HTTPS uses next/image;
 * unknown remotes use plain img so next/image never throws Invalid src.
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
  const [currentSrc, setCurrentSrc] = useState(safeSrc);
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [useObjectPublicFallback, setUseObjectPublicFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(safeSrc);
    setFailed(false);
    setFallbackFailed(false);
    setUseObjectPublicFallback(false);
  }, [safeSrc]);

  const activeSrc = failed && fallbackSrc && !isDeadImageUrl(fallbackSrc) && !fallbackFailed
    ? fallbackSrc
    : currentSrc;
  const monogramSrc =
    placeholderLabel && !activeSrc
      ? resolveBrandMonogramUrl(placeholderLabel)
      : '';

  const handleError = () => {
    if (
      shouldUseDirectCdnImage(currentSrc) &&
      !useObjectPublicFallback &&
      !failed
    ) {
      setUseObjectPublicFallback(true);
      return;
    }
    if (fallbackSrc && !failed && !isDeadImageUrl(fallbackSrc)) {
      setFailed(true);
      return;
    }
    if (fallbackSrc && failed && !fallbackFailed) {
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
      />
    );
  };

  if (isDataUrl || isSvg) {
    return renderPlainImg(renderSrc);
  }

  const variant =
    imageVariant || inferImageVariantFromWidth(width || (fill ? 512 : undefined));
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
    />
  );
}
