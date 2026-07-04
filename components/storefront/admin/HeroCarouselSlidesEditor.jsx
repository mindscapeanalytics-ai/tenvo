'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadOptimizedImage } from '@/lib/utils/optimizeImageClient';
import { sanitizeHeroSlides } from '@/lib/storefront/heroSlides';

/**
 * Multi-slide hero carousel editor for storefront settings.
 *
 * @param {{
 *   slides?: object[];
 *   defaultSlides?: object[];
 *   onChange: (slides: object[]) => void;
 *   businessId?: string;
 *   maxSlides?: number;
 *   minSlides?: number;
 * }} props
 */
export function HeroCarouselSlidesEditor({
  slides = [],
  defaultSlides = [],
  onChange,
  businessId,
  maxSlides = 6,
  minSlides = 4,
}) {
  const safeSlides = sanitizeHeroSlides(slides);
  const defaults = Array.isArray(defaultSlides) ? defaultSlides : [];

  const ensureSlotCount = (list) => {
    const next = [...list];
    while (next.length < minSlides) {
      next.push({
        eyebrow: '',
        title: '',
        subtitle: '',
        image: '',
        ctaLabel: '',
        ctaHref: '',
      });
    }
    return next.slice(0, maxSlides);
  };

  const displaySlides = ensureSlotCount(safeSlides);

  const updateSlide = (index, patch) => {
    const next = displaySlides.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  const addSlide = () => {
    if (displaySlides.length >= maxSlides) return;
    onChange([
      ...displaySlides,
      {
        eyebrow: '',
        title: '',
        subtitle: '',
        image: '',
        ctaLabel: '',
        ctaHref: '',
      },
    ]);
  };

  const removeSlide = (index) => {
    if (displaySlides.length <= minSlides) {
      updateSlide(index, { image: '', title: '', subtitle: '', eyebrow: '', ctaLabel: '', ctaHref: '' });
      return;
    }
    onChange(displaySlides.filter((_, i) => i !== index));
  };

  const resetToDefaults = () => {
    onChange([]);
    toast.success('Hero slides reset to template defaults');
  };

  const hasCustomImages = safeSlides.some((s) => s.image);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Upload up to {maxSlides} wide banner images (1920×1080). Images are converted to WebP
          before upload. Empty slots use template defaults for your store type.
        </p>
        {hasCustomImages ? (
          <Button type="button" variant="outline" size="sm" onClick={resetToDefaults}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reset to defaults
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">
        {displaySlides.map((slide, index) => (
          <HeroSlideRow
            key={index}
            index={index}
            slide={slide}
            defaultSlide={defaults[index]}
            businessId={businessId}
            onChange={(patch) => updateSlide(index, patch)}
            onRemove={() => removeSlide(index)}
            canRemove={displaySlides.length > minSlides || !!slide.image}
          />
        ))}
      </div>

      {displaySlides.length < maxSlides ? (
        <Button type="button" variant="outline" size="sm" onClick={addSlide}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add slide ({displaySlides.length}/{maxSlides})
        </Button>
      ) : null}
    </div>
  );
}

function HeroSlideRow({ index, slide, defaultSlide, businessId, onChange, onRemove, canRemove }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const preview = slide.image || defaultSlide?.image || '';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!businessId) {
      toast.error('Business context is required to upload images');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadOptimizedImage(file, businessId, 'hero');
      onChange({ image: url });
      toast.success(`Slide ${index + 1} uploaded`);
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Slide {index + 1}
          {!slide.image && defaultSlide?.title ? (
            <span className="ml-2 font-normal normal-case text-gray-400">
              — template: {defaultSlide.title.slice(0, 40)}
              {defaultSlide.title.length > 40 ? '…' : ''}
            </span>
          ) : null}
        </span>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-red-500 hover:text-red-600"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <div
          className="relative aspect-[16/10] cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-white hover:border-gray-400"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-300">
              <Image className="h-8 w-8" />
            </div>
          )}
          {slide.image ? (
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              Custom
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? 'Optimizing…' : slide.image ? 'Replace image' : 'Upload image'}
            </Button>
            {slide.image ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500"
                onClick={() => onChange({ image: '' })}
              >
                Clear image
              </Button>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Headline (optional)</Label>
              <Input
                value={slide.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder={defaultSlide?.title || 'Slide headline'}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button label (optional)</Label>
              <Input
                value={slide.ctaLabel || ''}
                onChange={(e) => onChange({ ctaLabel: e.target.value })}
                placeholder={defaultSlide?.ctaLabel || 'Shop Now'}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtext (optional)</Label>
            <Input
              value={slide.subtitle || ''}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder={defaultSlide?.subtitle || ''}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
