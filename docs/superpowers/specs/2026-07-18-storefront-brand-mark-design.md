# Storefront brand mark (logo / text / icon)

**Date:** 2026-07-18  
**Status:** Approved (Approach 1)

## Problem

Public chrome (header, footer, elevated site headers, some mobile nav) forks logo-vs-name rules per vertical. Owners only upload `businesses.logo_url` and cannot choose text-only (with style), icon-only, icon+text, or uploaded logo-only.

## Goals

- One owner setting drives brand mark across all 60+ domains.
- Modes: `text` | `icon` | `icon-text` | `logo` | `logo-text`.
- Text modes expose curated **text style** presets (Open Sans weight / tracking / case — no new font files).
- Icon modes use curated Lucide presets or optional small uploaded mark (`iconUrl`).
- Logo modes use existing `businesses.logo_url` upload (`purpose: logo`).
- Default when uploading a logo: prefer **logo** (image only); legacy tenants with a logo keep **logo-text** until they change mode.
- Single resolver + shared presentational component; elevated name formatters still apply to the text portion.

## Non-goals

- Per-surface overrides (header ≠ footer).
- Arbitrary Google Fonts.
- Changing OG/JSON-LD logo URL resolution beyond existing `logo_url`.

## Settings

Canonical: `business_settings.settings.storefront.branding`

```ts
{
  mode: 'text' | 'icon' | 'icon-text' | 'logo' | 'logo-text',
  textStyle: 'classic' | 'bold' | 'editorial' | 'light',
  iconKey: 'initial' | 'anchor' | 'sparkles' | 'dumbbell' | 'gem' | 'leaf' | 'bag' | 'hexagon',
  iconUrl?: string | null, // optional small mark; overrides iconKey when set
}
```

Logo file remains `businesses.logo_url` (form field `logoUrl`).

## Resolver

`lib/storefront/storefrontBrandMark.js`

- `normalizeStorefrontBranding(raw)`
- `getStorefrontBrandingConfig(settings)`
- `resolveStorefrontBrandMark({ business, settings, displayName? })` →  
  `{ mode, showLogo, showIcon, showText, logoUrl, iconKey, iconUrl, displayName, textClassName, textStyleInline }`
- Legacy: configured mode wins; else logo present → `logo-text`; else `text`.
- Soft fallbacks: logo mode without URL → text; icon mode without icon → initial letter tile.
- Keep `resolveStorefrontLogo` as logo URL only (dealership TCD) for SEO/meta callers.

## UI

Store Settings → Branding: **Brand mark** card (mode, conditional text style / icon / logo upload, live preview).

## Consumers

Replace ad-hoc logo+name blocks with `<StorefrontBrandMark />` in:

- `StoreHeader`, `StoreFooter`
- Pharmacy / Supermarket / Restaurant / Fitness site headers
- `RetailHomeHero`, `JewelleryMobileNav` brand row

Desktop layout / accent unchanged; mobile compact may hide text when mode is logo-only or icon-only.
