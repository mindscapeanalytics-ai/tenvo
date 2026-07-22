'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { getFallbackProductImageUrl } from '@/lib/storefront/productImageFallback';
import { cn } from '@/lib/utils';

/**
 * Company story band — product tyre fills the image panel, centred on a light field.
 */
export function TyreBrandStoryBlock({ story, productsUrl, accent, reverse = false }) {
  if (!story) return null;
  const href = story.href
    ? story.href.startsWith('/store/') || story.href.startsWith('http')
      ? story.href
      : `${productsUrl}${story.href}`
    : productsUrl;

  const fit = story.imageFit === 'cover' ? 'cover' : 'contain';

  return (
    <div
      className={cn(
        'group grid items-stretch overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-2',
        'motion-safe:transition motion-safe:hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'relative isolate flex min-h-[280px] items-center justify-center bg-zinc-50 sm:min-h-[340px] lg:min-h-[420px]',
          reverse && 'lg:order-2'
        )}
      >
        <SmartProductImage
          src={story.image}
          alt={story.title || ''}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            'motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-[1.02]',
            fit === 'cover'
              ? 'object-cover object-center'
              : 'object-contain object-center p-5 sm:p-8 lg:p-10'
          )}
          fallbackSrc={getFallbackProductImageUrl(
            { name: story.title || story.id || 'tyre', id: story.id || 'brand' },
            'tyre-shop'
          )}
          placeholderLabel={story.title}
        />
      </div>
      <div
        className={cn(
          'flex flex-col justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-12',
          reverse && 'lg:order-1'
        )}
      >
        {story.eyebrow ? (
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            {story.eyebrow}
          </p>
        ) : null}
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {story.title}
        </h3>
        {story.subtitle ? (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base">
            {story.subtitle}
          </p>
        ) : null}
        <Link
          href={href}
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white motion-safe:transition hover:opacity-95"
          style={{ backgroundColor: accent }}
        >
          {story.ctaLabel || 'Shop now'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
