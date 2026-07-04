'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Link2, Sparkles, X, Check, Loader2,
  ImagePlus, RefreshCw, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { uploadOptimizedImage } from '@/lib/utils/optimizeImageClient';
import { MAX_PRODUCT_IMAGES } from '@/lib/utils/productImages';

/**
 * Product image field for inventory forms.
 * Single image (default) or up to 3 optimized WebP uploads when maxImages > 1.
 *
 * @param {{
 *   value?: string;
 *   values?: string[];
 *   onChange: (url: string) => void;
 *   onChangeImages?: (urls: string[]) => void;
 *   maxImages?: number;
 *   productName?: string;
 *   category?: string;
 *   businessId?: string;
 * }} props
 */
export function ProductImageManager({
  value = '',
  values,
  onChange,
  onChangeImages,
  maxImages = 1,
  productName = '',
  category = '',
  businessId = '',
}) {
  const limit = Math.min(Math.max(1, maxImages), MAX_PRODUCT_IMAGES);
  const isMulti = limit > 1;

  const resolvedUrls = Array.isArray(values)
    ? values.filter(Boolean).slice(0, limit)
    : value
      ? [value]
      : [];

  const [urls, setUrls] = useState(resolvedUrls);
  const [tab, setTab] = useState('upload');
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    const next = Array.isArray(values)
      ? values.filter(Boolean).slice(0, limit)
      : value
        ? [value]
        : [];
    setUrls(next);
  }, [value, values, limit]);

  const commitUrls = useCallback(
    (next) => {
      const limited = next.filter(Boolean).slice(0, limit);
      setUrls(limited);
      onChangeImages?.(limited);
      onChange(limited[0] || '');
    },
    [limit, onChange, onChangeImages]
  );

  const canAddMore = urls.length < limit;

  const uploadFile = async (file, slotIndex = urls.length) => {
    if (!file) return;
    if (!canAddMore && slotIndex >= urls.length) {
      toast.error(`Maximum ${limit} image${limit > 1 ? 's' : ''} allowed`);
      return;
    }

    if (!businessId) {
      toast.error('Business context is required to upload images');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadOptimizedImage(file, businessId, 'product');
      const next = [...urls];
      if (slotIndex < next.length) {
        next[slotIndex] = url;
      } else {
        next.push(url);
      }
      commitUrls(next);
      toast.success(isMulti ? `Image ${Math.min(slotIndex + 1, limit)} uploaded` : 'Image uploaded');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAt = (index) => {
    commitUrls(urls.filter((_, i) => i !== index));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file, isMulti ? activeSlot : 0);
  };

  const applyUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    if (!/^https?:\/\/.+/.test(u)) {
      toast.error('Please enter a valid https:// URL');
      return;
    }
    if (!canAddMore && activeSlot >= urls.length) {
      toast.error(`Maximum ${limit} images allowed`);
      return;
    }
    const next = [...urls];
    if (activeSlot < next.length) {
      next[activeSlot] = u;
    } else {
      next.push(u);
    }
    commitUrls(next);
    setUrlInput('');
    toast.success('Image URL applied');
  };

  const autoFetch = async () => {
    const q = productName.trim();
    if (!q) {
      toast.error('Enter a product name first');
      return;
    }
    if (!canAddMore && activeSlot >= urls.length) {
      toast.error(`Maximum ${limit} images allowed`);
      return;
    }
    setFetching(true);
    try {
      const params = new URLSearchParams({ q, category });
      const res = await fetch(`/api/upload/product-image?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fetch failed');
      const next = [...urls];
      if (activeSlot < next.length) {
        next[activeSlot] = data.url;
      } else {
        next.push(data.url);
      }
      commitUrls(next);
      toast.success('Image fetched from internet');
    } catch (err) {
      toast.error(err.message || 'Could not fetch image');
    } finally {
      setFetching(false);
    }
  };

  const TABS = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'url', label: 'URL', icon: Link2 },
    { id: 'auto', label: 'Auto', icon: Sparkles },
  ];

  const primaryPreview = urls[0] || '';

  return (
    <div className="space-y-4">
      {isMulti ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Up to {limit} images · converted to WebP (~800×800) before upload. First image is the
            primary thumbnail.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: limit }).map((_, index) => {
              const src = urls[index];
              const isActive = activeSlot === index;
              return (
                <div
                  key={index}
                  className={cn(
                    'relative aspect-square rounded-xl border-2 overflow-hidden bg-gray-50',
                    isActive ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200',
                    !src && 'border-dashed cursor-pointer hover:border-gray-400'
                  )}
                  onClick={() => {
                    setActiveSlot(index);
                    if (!src) fileRef.current?.click();
                  }}
                >
                  {src ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAt(index);
                        }}
                        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {index === 0 ? (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          Primary
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-gray-300">
                      <ImagePlus className="h-7 w-7" />
                      <span className="mt-1 text-[10px] font-medium text-gray-400">Slot {index + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : primaryPreview ? (
        <div className="group relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryPreview} alt="Product preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => commitUrls([])}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
              title="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-green-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Check className="h-3 w-3" /> Image set
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex aspect-square w-full max-w-[280px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
          <ImagePlus className="h-10 w-10" />
          <p className="text-xs font-medium">No image yet</p>
        </div>
      )}

      <div className="flex gap-0.5 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 p-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all',
            dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Optimizing & uploading…</p>
            </div>
          ) : (
            <div className="pointer-events-none flex flex-col items-center gap-2">
              <Upload className={cn('h-8 w-8', dragging ? 'text-blue-400' : 'text-gray-300')} />
              <p className="text-sm font-semibold text-gray-700">
                {dragging ? 'Drop to upload' : isMulti ? `Add to slot ${activeSlot + 1}` : 'Click or drag & drop'}
              </p>
              <p className="text-xs text-gray-400">JPEG · PNG · WebP · GIF, max 5 MB before optimization</p>
              <p className="mt-1 text-xs text-gray-400">Auto-converted to WebP · resized to 800×800</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => uploadFile(e.target.files?.[0], isMulti ? activeSlot : 0)}
          />
        </div>
      )}

      {tab === 'url' && (
        <div className="space-y-3">
          <Label className="text-xs text-gray-500">
            Paste an image URL (https://…){isMulti ? ` — slot ${activeSlot + 1}` : ''}
          </Label>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/product.jpg"
              className="flex-1 rounded-xl text-sm"
              onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
            />
            <Button type="button" onClick={applyUrl} className="rounded-xl px-4" disabled={!urlInput.trim()}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {tab === 'auto' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-purple-800">
              <Sparkles className="h-4 w-4" />
              Auto-fetch from internet
            </p>
            <p className="mb-3 text-xs text-purple-600">
              Finds a relevant image from Unsplash using your product name
              {productName ? (
                <>
                  , will search for <strong>&quot;{productName}&quot;</strong>
                </>
              ) : (
                ' (enter a product name first)'
              )}
            </p>
            <Button
              type="button"
              onClick={autoFetch}
              disabled={fetching || !productName.trim()}
              className="w-full gap-2 rounded-xl"
            >
              {fetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Fetch Image
                </>
              )}
            </Button>
          </div>
          {primaryPreview ? (
            <Button
              type="button"
              variant="outline"
              onClick={autoFetch}
              disabled={fetching}
              className="w-full gap-2 rounded-xl text-xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', fetching && 'animate-spin')} />
              Try a different image
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
