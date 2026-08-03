'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/**
 * @param {unknown} images
 * @param {string} productName
 * @param {string | null | undefined} placeholderUrl
 */
function normalizeGalleryList(images, productName, placeholderUrl) {
  const list = [];
  if (Array.isArray(images)) {
    for (const item of images) {
      const url =
        typeof item === 'string'
          ? item.trim()
          : typeof item?.url === 'string'
            ? item.url.trim()
            : '';
      if (!url) continue;
      list.push({
        url,
        alt: (typeof item?.alt === 'string' && item.alt.trim()) || productName || '',
      });
    }
  }
  if (list.length > 0) return list;
  if (placeholderUrl) return [{ url: placeholderUrl, alt: productName || '' }];
  return [{ url: null, alt: productName || '' }];
}

export function ProductGallery({ images, productName, placeholderUrl }) {
  const imageList = normalizeGalleryList(images, productName, placeholderUrl);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    setSelectedIndex((prev) => (prev >= imageList.length ? 0 : prev));
  }, [imageList.length]);

  const selectedImage = imageList[selectedIndex] || imageList[0];
  const isSlider = imageList.length > 1 && imageList.every((img) => img?.url);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  }, [imageList.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  }, [imageList.length]);

  const handleMouseMove = (e) => {
    if (!isZoomed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
    setIsZoomed(false);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches?.[0]?.clientX ?? null;
    setIsZoomed(false);
  };

  const onTouchEnd = (e) => {
    if (!isSlider || touchStartX.current == null) return;
    const endX = e.changedTouches?.[0]?.clientX;
    if (endX == null) return;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) handleNext();
    else handlePrev();
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-zoom-in"
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            setIsZoomed(true);
          }
        }}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsFullscreen(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {selectedImage?.url ? (
          <>
            <SmartProductImage
              src={selectedImage.url}
              alt={selectedImage.alt || productName}
              fill
              imageVariant="detail"
              className={cn(
                'object-cover transition-opacity duration-200',
                isZoomed && 'motion-safe:scale-150 transition-transform duration-300'
              )}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : {}
              }
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </div>

            {isSlider ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">No image available</p>
            </div>
          </div>
        )}

        {isSlider ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm tabular-nums">
            {selectedIndex + 1} / {imageList.length}
          </div>
        ) : null}
      </div>

      {isSlider ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageList.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                selectedIndex === index
                  ? 'border-gray-900 ring-2 ring-gray-200'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              {image?.url ? (
                <SmartProductImage
                  src={image.url}
                  alt={image.alt || `${productName} - ${index + 1}`}
                  fill
                  imageVariant="thumb"
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0" hideCloseButton>
          <DialogTitle className="sr-only">{productName} gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Fullscreen product image viewer. Use arrow buttons to change images.
          </DialogDescription>
          <div
            className="relative w-full h-full bg-black flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>

            {selectedImage?.url ? (
              <SmartProductImage
                src={selectedImage.url}
                alt={selectedImage.alt || productName}
                fill
                imageVariant="detail"
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : null}

            {isSlider ? (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
