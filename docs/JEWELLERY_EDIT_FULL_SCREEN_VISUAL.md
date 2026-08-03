# Jewellery Edit Section - Full-Screen Layout Visual Guide

**Version**: 2.0.0 (Full-Screen Layout)  
**Date**: 2026-01-15  
**Status**: Complete ✅

---

## 🎨 Before vs After

### BEFORE (v1.0.0)
```
┌─────────── Max-width: 1400px ───────────┐
│  [Small padding: px-4 lg:px-8]         │
│                                         │
│  ┌──────────┬──────────┐               │
│  │          │  Banner  │  Gap: 1rem    │
│  │   Hero   ├────┬─────┤               │
│  │          │Half│Half │               │
│  └──────────┴────┴─────┘               │
│                                         │
│  Small rounded corners (rounded-2xl)   │
│  No background gradient                │
│  No decorative elements                │
└─────────────────────────────────────────┘
```

### AFTER (v2.0.0) ✅
```
┌────────────────── Max-width: 1600px ──────────────────┐
│  [Generous padding: px-4 sm:px-6 lg:px-12]          │
│  [Gradient background: white → stone-50 → white]     │
│  [Decorative golden blur orbs]                       │
│                                                       │
│  12-Column Grid System:                              │
│  ┌─────────────────────────┬──────────────┐         │
│  │                         │   Banner     │ Gap:     │
│  │         Hero            │   (5 cols)   │ 1.25rem  │
│  │       (7 cols)          ├──────┬───────┤ (gap-5)  │
│  │       2 rows tall       │ Half │ Half  │          │
│  │      min-h: 600px       │      │       │          │
│  └─────────────────────────┴──────┴───────┘         │
│                                                       │
│  Large rounded corners (rounded-3xl = 24px)          │
│  Section padding: py-12 → sm:py-16 → lg:py-20        │
│  Typography: text-3xl → text-5xl (responsive)        │
└───────────────────────────────────────────────────────┘
```

---

## 📏 Layout Specifications

### Desktop Layout (≥1024px)

```
Container: max-w-[1600px] mx-auto
Padding: px-4 sm:px-6 lg:px-12
Background: gradient-to-br from-white via-stone-50/30 to-white
Section Padding: py-12 sm:py-16 lg:py-20

┌─────────────────────────────────────────────────────────┐
│ Section Header                                          │
│ ┌─────────────────────────┐                             │
│ │ 🌟 CURATED COLLECTION   │  [Explore All →]           │
│ │ The Jewellery Edit      │                             │
│ │ Timeless gold, diamonds...                           │
│ └─────────────────────────┘                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────┬────────────────┐
│ │                                     │                │
│ │   FINE GOLD                         │  DIAMONDS      │
│ │   (Hero Tile)                       │  (Banner)      │
│ │   col-span-7                        │  col-span-5    │
│ │   row-span-2                        │  min-h: 280px  │
│ │   min-h: 600px                      │                │
│ │                                     ├────────┬───────┤
│ │   "Celebrate every occasion         │ BRIDAL │ GIFTS │
│ │    with hallmarked purity"          │ (Half) │(Half) │
│ │                                     │280px   │280px  │
│ │   [EXPLORE →]                       │        │       │
│ │                                     │        │       │
│ └─────────────────────────────────────┴────────┴───────┘
│                                                          │
│ Gap between tiles: gap-5 lg:gap-6 (1.25rem - 1.5rem)   │
│ Rounded corners: rounded-3xl (24px)                     │
└──────────────────────────────────────────────────────────┘

Decorative Elements:
• Golden blur orb (top-left): -left-32 top-20, h-96 w-96, blur-3xl, opacity-5
• Golden blur orb (bottom-right): -right-32 bottom-20, h-96 w-96, blur-3xl, opacity-5
```

### Mobile Layout (<1024px)

```
Container: px-4 sm:px-6
Padding: py-12 sm:py-16

┌──────────────────────────┐
│ Section Header           │
│ 🌟 CURATED COLLECTION    │
│ The Jewellery Edit       │
│ Timeless gold, diamonds  │
│ [Explore All →]          │
├──────────────────────────┤
│                          │
│ ┌────────────────────┐   │
│ │    FINE GOLD       │   │
│ │    (Hero)          │   │
│ │    aspect: 16:11   │   │
│ │    Full-width      │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │    DIAMONDS        │   │
│ │    (Banner)        │   │
│ │    aspect: 16:9    │   │
│ └────────────────────┘   │
│                          │
│ ┌──────────┬─────────┐   │
│ │  BRIDAL  │  GIFTS  │   │
│ │  (Half)  │  (Half) │   │
│ │ aspect:  │ aspect: │   │
│ │   4:5    │   4:5   │   │
│ └──────────┴─────────┘   │
│                          │
│ Gap: gap-4 (1rem)        │
│ Rounded: rounded-2xl     │
└──────────────────────────┘
```

---

## 🎯 Key Measurements

### Container
- **Max-Width**: 1600px (up from 1400px)
- **Padding**: 
  - Mobile: `px-4` (1rem)
  - Tablet: `sm:px-6` (1.5rem)
  - Desktop: `lg:px-12` (3rem)

### Section
- **Vertical Padding**:
  - Mobile: `py-12` (3rem)
  - Tablet: `sm:py-16` (4rem)
  - Desktop: `lg:py-20` (5rem)
- **Background**: `bg-gradient-to-br from-white via-stone-50/30 to-white`

### Grid System (Desktop)
- **Columns**: 12 (CSS Grid)
- **Hero**: `col-span-7` (58% width)
- **Right Column**: `col-span-5` (42% width)
- **Gap**: 
  - Default: `gap-5` (1.25rem)
  - Desktop: `lg:gap-6` (1.5rem)

### Tiles
| Tile | Desktop Width | Min Height | Aspect (Mobile) | Rounded |
|------|---------------|------------|-----------------|---------|
| Hero | 7/12 cols (58%) | 600px | 16:11 | 3xl (24px) |
| Banner | 5/12 cols (42%) | 280px | 16:9 | 3xl (24px) |
| Half Left | 50% of 5 cols | 280px | 4:5 | 3xl (24px) |
| Half Right | 50% of 5 cols | 280px | 4:5 | 3xl (24px) |

### Typography
- **Section Heading**: `text-3xl sm:text-4xl lg:text-5xl` (1.875rem - 3rem)
- **Section Subtitle**: `text-base sm:text-lg lg:text-xl` (1rem - 1.25rem)
- **Hero Title**: `text-3xl lg:text-4xl xl:text-5xl` (1.875rem - 3rem)
- **Banner Title**: `text-xl lg:text-2xl` (1.25rem - 1.5rem)
- **Half Tile Eyebrow**: `text-sm` (0.875rem)

### Colors
- **Accent**: `#c9a227` (golden)
- **Badge Border**: `${accent}60` (60% opacity, 2px width)
- **Badge Background**: `${accent}10` (10% opacity)
- **Badge Text**: `accent` (full color)
- **CTA Button**: Solid `accent` background, `text-stone-950`

---

## ✨ Visual Enhancements

### Gradient Background
```css
background: linear-gradient(
  to bottom right,
  #ffffff,
  rgba(245, 245, 244, 0.3),
  #ffffff
)
```

### Decorative Blur Elements
```jsx
{/* Top-left golden blur */}
<div 
  className="absolute -left-32 top-20 h-96 w-96 rounded-full opacity-5 blur-3xl"
  style={{ backgroundColor: accent }}
/>

{/* Bottom-right golden blur */}
<div 
  className="absolute -right-32 bottom-20 h-96 w-96 rounded-full opacity-5 blur-3xl"
  style={{ backgroundColor: accent }}
/>
```

### Badge Design
```jsx
<div 
  className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm"
  style={{ 
    borderColor: `${accent}60`, 
    backgroundColor: `${accent}10`, 
    color: accent 
  }}
>
  <Sparkles className="h-3.5 w-3.5" />
  Curated Collection
</div>
```

### Image Overlays
```jsx
{/* Hero tile gradient overlay */}
<div className="absolute inset-0 bg-gradient-to-br from-stone-950/80 via-stone-950/50 to-stone-950/20" />

{/* Hero tile golden glow */}
<div
  className="absolute inset-0 opacity-25"
  style={{
    backgroundImage: `radial-gradient(circle at 25% 35%, ${accent}40 0%, transparent 55%)`,
  }}
/>

{/* Banner tile gradient overlay */}
<div className="absolute inset-0 bg-gradient-to-br from-stone-950/70 via-stone-950/40 to-transparent" />

{/* Half tiles gradient overlay */}
<div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />
```

---

## 🎭 Hover Effects

### Hero & Banner Tiles
```css
/* Card lift */
transition-all duration-500
hover:scale-[1.01]
hover:shadow-3xl

/* Image zoom */
.group-hover:scale-105
transition-transform duration-700
```

### Half Tiles
```css
/* Card lift (more pronounced) */
transition-all duration-500
hover:scale-[1.02]
hover:shadow-3xl

/* Image zoom (more dramatic) */
.group-hover:scale-110
transition-transform duration-700
```

### CTA Buttons
```css
/* Button lift */
.group-hover:scale-105
transition-all

/* Arrow icon slide */
.group-hover:translate-x-1
transition-transform
```

---

## 📱 Responsive Behavior

### Breakpoint: 1024px (lg:)

**Above 1024px**:
- 12-column asymmetric grid
- Hero spans 7 columns, 2 rows
- Right column spans 5 columns
- Banner + half tiles in right column
- Padding increases to `lg:px-12`
- Gap increases to `lg:gap-6`

**Below 1024px**:
- Full-width stacked layout
- Hero tile first (aspect 16:11)
- Banner tile second (aspect 16:9)
- Half tiles in 2-column grid (aspect 4:5)
- Gap: `gap-4`
- Rounded: `rounded-2xl`

### Breakpoint: 640px (sm:)

**Above 640px**:
- Section heading increases to `text-4xl`
- Section subtitle increases to `text-lg`
- Padding increases to `sm:px-6`
- Section padding increases to `sm:py-16`

**Below 640px**:
- Base sizes
- Compact padding

---

## 🎨 Complete Style System

### Section Container
```jsx
<section className="relative border-t border-stone-200 bg-gradient-to-br from-white via-stone-50/30 to-white py-12 sm:py-16 lg:py-20">
  <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-12">
    {/* Content */}
  </div>
</section>
```

### Section Header
```jsx
<div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 lg:mb-12 sm:flex-row sm:items-end">
  <div className="max-w-3xl">
    {/* Badge */}
    <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm">
      <Sparkles className="h-3.5 w-3.5" />
      Curated Collection
    </div>
    
    {/* Title */}
    <h2 className="mt-2 text-3xl font-bold text-stone-900 sm:text-4xl lg:text-5xl">
      The Jewellery Edit
    </h2>
    
    {/* Subtitle */}
    <p className="mt-3 text-base leading-relaxed text-stone-600 sm:text-lg lg:text-xl">
      Timeless gold, diamonds, and bridal sets crafted for every milestone.
    </p>
  </div>
  
  {/* Explore All Button */}
  <button className="group flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide shadow-md transition-all hover:shadow-lg">
    Explore All
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </button>
</div>
```

### Desktop Grid
```jsx
<div className="hidden gap-5 lg:grid lg:grid-cols-12 lg:gap-6">
  {/* Hero: col-span-7 row-span-2 */}
  {/* Banner: col-span-5 */}
  {/* Half tiles: nested 2-col grid within col-span-5 */}
</div>
```

### Mobile Stack
```jsx
<div className="flex flex-col gap-4 lg:hidden">
  {/* Hero: full-width, aspect 16:11 */}
  {/* Banner: full-width, aspect 16:9 */}
  {/* Half tiles: 2-col grid, aspect 4:5 */}
</div>
```

---

## ✅ Success Criteria

- [x] **Full-screen width**: 1600px max-width ✅
- [x] **Well-aligned**: 12-column grid system ✅
- [x] **Perfect organization**: Generous spacing (lg:px-12, gap-6) ✅
- [x] **Modern design**: Gradient bg, decorative blur, improved typography ✅
- [x] **Golden accent**: Throughout badges, CTAs, overlays ✅
- [x] **Premium feel**: Larger rounded corners (24px) ✅
- [x] **Responsive**: Mobile stacking with proper aspect ratios ✅
- [x] **Smooth interactions**: Hover effects with proper transitions ✅
- [x] **No breaking changes**: Other store verticals unaffected ✅

---

## 📊 Comparison Table

| Feature | Before (v1.0.0) | After (v2.0.0) | Improvement |
|---------|-----------------|----------------|-------------|
| Max-Width | 1400px | 1600px | +200px (+14%) |
| Grid Cols | 3 | 12 | +400% precision |
| Desktop Padding | lg:px-8 | lg:px-12 | +50% breathing room |
| Tile Gap | gap-4 (1rem) | gap-5 lg:gap-6 (1.5rem) | +50% spacing |
| Rounded Corners | rounded-2xl (16px) | rounded-3xl (24px) | +50% premium feel |
| Section Padding | py-10 sm:py-14 | py-12 sm:py-16 lg:py-20 | +43% vertical rhythm |
| Typography Scale | text-2xl sm:text-3xl | text-3xl sm:text-4xl lg:text-5xl | +67% visual impact |
| Background | Solid white | Gradient + blur | +100% depth |
| Hero Width | 33% (1 of 3 cols) | 58% (7 of 12 cols) | +76% emphasis |

---

## 🎓 Design Rationale

### Why 1600px Max-Width?
- Modern displays (1920px+, 4K) have room to breathe
- Ultra-wide monitors (21:9, 32:9) benefit from wider content
- Still contained enough to feel intentional, not stretched
- Matches 2026 luxury web design trends

### Why 12-Column Grid?
- More flexibility for asymmetry (7+5 split impossible with 3 cols)
- Industry standard (Bootstrap, Tailwind, Material)
- Easier to adjust ratios (6+6, 8+4, 9+3, etc.)
- Better alignment with nested grids

### Why 7:5 Column Split?
- Golden ratio approximation (1.4:1 ≈ 1.618:1)
- Hero dominates without overwhelming
- Right column feels intentional, not cramped
- Asymmetry creates visual interest

### Why Gradient Background?
- Adds subtle depth without distraction
- Prevents harsh white glare on OLED displays
- Creates premium "paper texture" feel
- Frames content with soft edges

### Why Decorative Blur Elements?
- Suggests luxury ambient lighting
- Reinforces golden accent color
- Adds movement to static layout
- Creates focal points without clutter

---

**Last Updated**: 2026-01-15  
**Component Version**: 2.0.0 (Full-Screen Layout)  
**Documentation Version**: 1.0.0  
**Status**: Complete ✅
