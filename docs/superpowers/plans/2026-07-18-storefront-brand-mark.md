# Storefront Brand Mark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Owner-configurable brand mark modes (text / icon / logo combinations) render consistently across all public storefront chrome.

**Architecture:** Persist `settings.storefront.branding`; resolve via `storefrontBrandMark.js`; render via `StorefrontBrandMark.jsx`; keep `businesses.logo_url` for image assets and `resolveStorefrontLogo` for URL-only callers.

**Tech Stack:** Next.js App Router, existing Store Settings form, Lucide icons, Open Sans CSS presets.

## Global Constraints

- No em dashes in UI copy.
- Dual layout `lg:` unchanged for hub; storefront chrome keeps existing elevated shells.
- Logo upload continues via `purpose: logo` + `optimizeImageClient`.
- Do not invent new font files; text styles are CSS on Open Sans / system stack.

---

### Task 1: Brand mark lib + verify script

**Files:**
- Create: `lib/storefront/storefrontBrandMark.js`
- Create: `scripts/verify-storefront-brand-mark.mjs`
- Modify: `lib/storefront/resolveStorefrontLogo.js` (re-export note / keep API)

- [ ] Implement normalize + resolve + text style class map + icon key list
- [ ] Legacy inference: logo → `logo-text`, else `text`
- [ ] Verify script asserts modes and fallbacks
- [ ] Run `node scripts/verify-storefront-brand-mark.mjs`

### Task 2: Shared UI component

**Files:**
- Create: `components/storefront/StorefrontBrandMark.jsx`

- [ ] Props: business, settings, displayName?, size (`sm`|`md`|`lg`), className, nameClassName, accent
- [ ] Render logo image / icon tile / text per resolved mode

### Task 3: Settings load/save + Branding UI

**Files:**
- Modify: `lib/actions/storefront/admin.js`
- Modify: `components/StoreSettingsManager.jsx`

- [ ] Return `branding` from getStorefrontSettings
- [ ] Persist `settings.storefront.branding` on update
- [ ] Brand mark card: mode, text style, icon, logo upload, preview

### Task 4: Wire consumers

**Files:**
- Modify: `StoreHeader.jsx`, `StoreFooter.jsx`, elevated `*SiteHeader.jsx`, `RetailHomeHero.jsx`, `JewelleryMobileNav.jsx`

- [ ] Replace local logo/name forks with `StorefrontBrandMark`
- [ ] Preserve elevated displayName formatters

### Task 5: Smoke verify

- [ ] Run `node scripts/verify-storefront-brand-mark.mjs`
- [ ] Manual: Branding modes preview; header/footer match
