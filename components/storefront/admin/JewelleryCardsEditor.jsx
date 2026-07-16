'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadOptimizedImage } from '@/lib/utils/optimizeImageClient';
import {
  getJewelleryCardSlotDefs,
  JEWELLERY_HERO_CARD_SLOTS,
  BEAUTY_HERO_CARD_SLOTS,
  JEWELLERY_EDIT_CARD_SLOTS,
  BEAUTY_EDIT_CARD_SLOTS,
} from '@/lib/storefront/jewelleryCategoryCards';
import { getStoreMode } from '@/lib/storefront/jewelleryStorefront';

function ImageUploadField({ value, onChange, businessId, label = 'Image' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!businessId) {
      toast.error('Business context required to upload');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadOptimizedImage(file, businessId, 'banner');
      onChange(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => onChange('')}>
            Clear (use inventory)
          </Button>
        ) : null}
      </div>
      {value ? (
        <div className="h-20 overflow-hidden rounded-lg border bg-gray-50">
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <p className="text-xs text-gray-400">Empty uses a live product or category photo.</p>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function CategoryLinkField({ categories = [], value, onChange, onPick }) {
  if (!categories.length) {
    return (
      <p className="text-xs text-gray-500">
        Add categories in Inventory to link cards to live catalog collections.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">Inventory category</Label>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value || ''}
        onChange={(e) => {
          const slug = e.target.value;
          onChange(slug);
          const cat = categories.find((row) => row.slug === slug);
          if (cat && onPick) onPick(cat);
        }}
      >
        <option value="">Auto from inventory</option>
        {categories.map((cat) => (
          <option key={cat.id || cat.slug} value={cat.slug}>
            {cat.name}
            {cat.product_count ? ` (${cat.product_count})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

function ensureTiles(saved, defaults) {
  const byId = new Map((Array.isArray(saved) ? saved : []).map((t) => [String(t.id || t.slot || ''), t]));
  return defaults.map((def, index) => {
    const match =
      byId.get(String(def.id)) ||
      byId.get(String(def.slot || '')) ||
      (Array.isArray(saved) ? saved[index] : null) ||
      {};
    return {
      id: def.id,
      slot: def.slot,
      label: match.label ?? '',
      desc: match.desc ?? '',
      eyebrow: match.eyebrow ?? '',
      title: match.title ?? '',
      ctaLabel: match.ctaLabel ?? '',
      href: match.href ?? '',
      image: match.image ?? '',
      categorySlug: match.categorySlug ?? match.slug ?? '',
      imageKey: def.imageKey || def.id,
    };
  });
}

function HeroTilesEditor({ tiles, onChange, businessId, categories }) {
  const updateTile = (index, key, val) => {
    onChange(tiles.map((t, i) => (i === index ? { ...t, [key]: val } : t)));
  };

  const updateTileFields = (index, patch) => {
    onChange(tiles.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  return (
    <div className="space-y-4">
      {tiles.map((tile, index) => (
        <div key={tile.id || index} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Hero card {index + 1} · {tile.id}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={tile.label || ''}
                onChange={(e) => updateTile(index, 'label', e.target.value)}
                placeholder="Leave blank for inventory / default"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subtitle</Label>
              <Input
                value={tile.desc || ''}
                onChange={(e) => updateTile(index, 'desc', e.target.value)}
                placeholder="Leave blank for default"
              />
            </div>
            <div className="sm:col-span-2">
              <CategoryLinkField
                categories={categories}
                value={tile.categorySlug || ''}
                onChange={(slug) => updateTile(index, 'categorySlug', slug)}
                onPick={(cat) => {
                  updateTileFields(index, {
                    categorySlug: cat.slug,
                    href: `?category=${encodeURIComponent(cat.slug)}`,
                  });
                }}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Custom link (optional)</Label>
              <Input
                value={tile.href || ''}
                onChange={(e) => updateTile(index, 'href', e.target.value)}
                placeholder="?category=gold or /products"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Card image"
                value={tile.image || ''}
                onChange={(v) => updateTile(index, 'image', v)}
                businessId={businessId}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditTilesEditor({ tiles, onChange, businessId, categories }) {
  const updateTile = (index, key, val) => {
    onChange(tiles.map((t, i) => (i === index ? { ...t, [key]: val } : t)));
  };

  const updateTileFields = (index, patch) => {
    onChange(tiles.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  return (
    <div className="space-y-4">
      {tiles.map((tile, index) => (
        <div key={tile.slot || tile.id || index} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Mosaic · {tile.slot || tile.id}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Eyebrow</Label>
              <Input
                value={tile.eyebrow || ''}
                onChange={(e) => updateTile(index, 'eyebrow', e.target.value)}
                placeholder="Leave blank for default"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CTA label</Label>
              <Input
                value={tile.ctaLabel || ''}
                onChange={(e) => updateTile(index, 'ctaLabel', e.target.value)}
                placeholder="EXPLORE"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Headline (optional)</Label>
              <Input
                value={tile.title || ''}
                onChange={(e) => updateTile(index, 'title', e.target.value)}
                placeholder="Leave blank for default"
              />
            </div>
            <div className="sm:col-span-2">
              <CategoryLinkField
                categories={categories}
                value={tile.categorySlug || ''}
                onChange={(slug) => updateTile(index, 'categorySlug', slug)}
                onPick={(cat) => {
                  updateTileFields(index, {
                    categorySlug: cat.slug,
                    href: `?category=${encodeURIComponent(cat.slug)}`,
                  });
                }}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Custom link (optional)</Label>
              <Input
                value={tile.href || ''}
                onChange={(e) => updateTile(index, 'href', e.target.value)}
                placeholder="?category=diamonds"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Banner image"
                value={tile.image || ''}
                onChange={(v) => updateTile(index, 'image', v)}
                businessId={businessId}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Owner editor for jewellery/beauty hero cards + editorial mosaic tiles.
 * Blank fields keep resolving from live inventory on the public storefront.
 */
export function JewelleryCardsEditor({
  jewellery = {},
  setJewellery,
  businessCategory,
  businessId,
  categories = [],
}) {
  const mode = getStoreMode(businessCategory);
  const heroDefaults = mode === 'beauty' ? BEAUTY_HERO_CARD_SLOTS : JEWELLERY_HERO_CARD_SLOTS;
  const editDefaults = mode === 'beauty' ? BEAUTY_EDIT_CARD_SLOTS : JEWELLERY_EDIT_CARD_SLOTS;

  const heroTiles = ensureTiles(jewellery.heroTiles, heroDefaults);
  const editTiles = ensureTiles(
    jewellery.jewelleryEdit?.tiles || jewellery.jewelleryEditTiles,
    editDefaults
  );

  const resetHero = () => {
    setJewellery('heroTiles', getJewelleryCardSlotDefs(mode, 'hero').map((d) => ({
      id: d.id,
      label: '',
      desc: '',
      href: '',
      image: '',
      categorySlug: '',
      imageKey: d.imageKey || d.id,
    })));
    toast.success('Hero cards reset to inventory defaults');
  };

  const resetEdit = () => {
    setJewellery('jewelleryEdit', {
      ...(jewellery.jewelleryEdit || {}),
      tiles: editDefaults.map((d) => ({
        id: d.id,
        slot: d.slot,
        eyebrow: '',
        title: '',
        ctaLabel: '',
        href: '',
        image: '',
        categorySlug: '',
        imageKey: d.imageKey || d.id,
      })),
    });
    toast.success('Editorial mosaic reset to inventory defaults');
  };

  return (
    <>
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Hero category cards
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={resetHero}>
          Reset
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Four cards under the hero. Leave fields blank to auto-update from inventory photos and categories.
      </p>
      <HeroTilesEditor
        tiles={heroTiles}
        onChange={(next) => setJewellery('heroTiles', next)}
        businessId={businessId}
        categories={categories}
      />

      <Separator />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Editorial mosaic tiles
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={resetEdit}>
          Reset
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        The Jewellery Edit / Beauty Edit mosaic. Blank fields keep using live catalog images and links.
      </p>
      <EditTilesEditor
        tiles={editTiles}
        onChange={(next) =>
          setJewellery('jewelleryEdit', {
            ...(jewellery.jewelleryEdit || {}),
            tiles: next,
          })
        }
        businessId={businessId}
        categories={categories}
      />
    </>
  );
}
