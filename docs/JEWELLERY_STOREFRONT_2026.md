# Jewelry Storefront — 2026 Design Modernization

## Overview

The jewelry storefront template has been modernized with 2026 design principles, creating a premium luxury experience that differentiates gems-jewellery from the clothing/fashion template while maintaining the elevated luxury foundation.

## 🎨 2026 Design Principles Applied

### 1. **Immersive Visual Storytelling**
- Full-bleed hero imagery with subtle parallax scrolling
- High-quality curated Unsplash jewelry photography
- Golden shimmer particle effects (CSS-only, `prefers-reduced-motion` safe)
- Cinematic gradient overlays with golden accent hints

### 2. **Premium Micro-interactions**
- Smooth hover scale transitions (1.02-1.05x) with golden glow effects
- Certification badge reveals with radial golden shimmer
- Category circles with 110% scale + border glow on hover
- Product cards with luxury shadow elevation and subtle parallax

### 3. **Trust Through Transparency**
- Prominent certification badges (GIA, Hallmark, IGI)
- Trust pillar strip with premium badge styling
- Domain data specifications (Carat, Clarity, Cut, Weight)
- Social proof ratings with golden star accents

### 4. **Sensory Design**
- Golden shimmer particles (12 floating elements) with staggered animations
- Smooth scroll reveals via `StoreReveal` wrapper
- Luxury packaging visual cues in trust strip
- Warm stone color palette (stone-50 → stone-950) vs cold slate

### 5. **Mobile-First Luxury**
- Touch-optimized swipe gestures on hero carousel
- Grid layouts: 3-col mobile → 8-col desktop for categories
- Responsive golden glow effects (CSS radial gradients)
- Bottom-aligned hero content on mobile for thumb reach

### 6. **Performance Optimized**
- CSS-only animations (no JavaScript for motion)
- `prefers-reduced-motion` support (hides particles, slows carousel)
- Lazy-loaded product images with `SmartProductImage`
- Staggered reveal delays (50-75ms per item) for perceived speed

---

## 📁 New File Structure

### **Core Configuration**
- `lib/storefront/jewelleryStorefront.js` — Jewelry-specific config, trust pillars, SEO, hero slides
- `lib/storefront/jewelleryHomeSections.js` — Section builder (categories, signature pieces, offers)

### **Components**
- `components/storefront/sections/heroes/JewelleryHero.jsx` — Immersive full-bleed hero with particles
- `components/storefront/sections/jewellery/JewelleryHomeSections.jsx` — Main sections orchestrator
- `components/storefront/sections/jewellery/JewelleryTrustStrip.jsx` — Certification trust pillars
- `components/storefront/sections/jewellery/JewelleryCategoryCircles.jsx` — Circular category showcase
- `components/storefront/sections/jewellery/JewellerySignaturePieces.jsx` — Featured high-value jewelry

### **Styling**
- `tailwind.config.ts` — Added `shimmer-float` and `pulse-slow` animations

---

## 🔧 Integration Guide

### **1. Update Hero Router**

In `components/storefront/sections/DomainHeroRouter.jsx`, add jewelry hero routing:

```jsx
import { JewelleryHero } from './heroes/JewelleryHero';
import { isJewelleryStore } from '@/lib/storefront/jewelleryStorefront';

export function DomainHeroRouter({ business, heroPreset, ... }) {
  // ... existing code ...
  
  if (isJewelleryStore(businessCategory)) {
    return <JewelleryHero preset={heroPreset} accent={accent} />;
  }
  
  // ... fallback to other heroes ...
}
```

### **2. Update Homepage Section Router**

In `components/storefront/sections/LazyVerticalHomeSections.jsx`:

```jsx
import { JewelleryHomeSections } from './jewellery/JewelleryHomeSections';
import { buildJewelleryHomeSections } from '@/lib/storefront/jewelleryHomeSections';
import { isJewelleryStore } from '@/lib/storefront/jewelleryStorefront';

export function LazyVerticalHomeSections({ ... }) {
  // ... existing code ...
  
  if (isJewelleryStore(businessCategory)) {
    const jewelleryDepartments = buildJewelleryHomeSections({
      businessDomain,
      businessCategory,
      categories: storeCategories,
      products: allProducts,
      newArrivalProducts: newProducts,
      offerProducts: onSaleProducts,
    });
    
    return (
      <JewelleryHomeSections
        businessDomain={businessDomain}
        businessCategory={businessCategory}
        settings={settings}
        products={allProducts}
        accent={accent}
        accentDark={accentDark}
        storeName={businessName}
        businessDescription={businessDescription}
        country={country}
        jewelleryDepartments={jewelleryDepartments}
        categories={storeCategories}
        topCollections={topCollections}
      />
    );
  }
  
  // ... fallback to fashion/other sections ...
}
```

### **3. Update Hero Preset Builder**

In the page/layout that builds `heroPreset`, use jewelry-specific slides:

```jsx
import { getJewelleryHeroSlides } from '@/lib/storefront/jewelleryStorefront';

const heroPreset = {
  slides: isJewelleryStore(businessCategory)
    ? getJewelleryHeroSlides(`/store/${businessDomain}`, settings, { coverImage })
    : // ... other hero slides ...
  hideRating: false,
};
```

### **4. Update Store Search Placeholder**

```jsx
import { resolveJewellerySearchPlaceholder } from '@/lib/storefront/jewelleryStorefront';

const searchPlaceholder = isJewelleryStore(businessCategory)
  ? resolveJewellerySearchPlaceholder(settings, businessDomain)
  : // ... other placeholders ...
```

### **5. Seed Jewelry Storefront Settings on Registration**

In `lib/onboarding/registrationStorefrontDefaults.js`:

```javascript
import { buildDefaultJewelleryStorefrontSeed } from '@/lib/storefront/jewelleryStorefront';

export function getRegistrationStorefrontDefaults(category, country) {
  if (category === 'gems-jewellery') {
    return {
      storefront: {
        ...buildDefaultJewelleryStorefrontSeed(),
        // ... other defaults ...
      },
    };
  }
  // ... other verticals ...
}
```

---

## 🎯 Key Differentiators from Fashion Template

| **Aspect** | **Fashion/Clothing** | **Jewelry** |
|------------|---------------------|-------------|
| **Hero Style** | Editorial (Zellbury-inspired) | Immersive luxury with golden particles |
| **Homepage Sections** | Unstitched, RTW, Accessories rails | Signature Pieces, Category Circles, Offers |
| **Color Palette** | Boutique black/Textile red/Leather amber | Golden accent (#c9a227) with stone base |
| **Trust Elements** | Easy returns, Secure checkout | Hallmark certification, Insured shipping, GIA badges |
| **Product Focus** | Fabric type, Stitching status, Sourcing | Carat, Clarity, Cut, Certification, Weight |
| **Imagery** | Lifestyle fashion photography | Close-up jewelry detail shots with sparkle |
| **Hover Effects** | Subtle lift + shadow | Golden glow ring + scale + shimmer |
| **Category Display** | Square tiles (unstitched) | Circular tiles (gold, diamonds, bridal) |
| **Animations** | Scroll reveals, Manual carousels | Particles, Parallax, Auto-advancing hero |

---

## 📦 Demo Store

**Domain**: `demo-jewellery`  
**Catalog**: 27 curated jewelry SKUs in `GEMS_JEWELLERY_SEED_PRODUCTS`  
**Categories**: Gold, Diamonds, Bridal, Necklaces, Earrings, Rings, Bracelets, Pearls, Silver, Gold Coins, Gifts  
**Price Range**: Rs 4,200 – Rs 425,000  
**Demo Brands**: Heritage Gold, Lumière Diamonds, Royal Heritage, Saddar Jewellers, Pearl & Co, Silver Craft

---

## 🎨 Visual Design Tokens

### **Golden Accent Palette**
```js
{
  accent: '#c9a227',       // Primary golden accent
  accentDark: '#9a7b1a',   // Hover states, brand badges
  accentLight: '#faf6ef'   // Background subtle tints
}
```

### **Warm Stone Palette** (vs Fashion's cold slate)
- Background: `stone-50` (warmer neutral)
- Borders: `stone-200` → `stone-300` on hover
- Text: `stone-600` (body), `stone-900` (headings)
- Overlays: `stone-950/85` (hero gradient)

### **Typography**
- Headings: `font-serif` for luxury feel (vs fashion's sans-serif)
- Body: Open Sans (shared with platform)
- Tracking: `tracking-[0.2em]` on eyebrows/badges for luxury spacing

### **Spacing & Scale**
- Hero height: `100svh` mobile, `92vh` desktop
- Product cards: `aspect-[3/4]` for vertical jewelry emphasis
- Category circles: `aspect-square` with 8-column grid
- Hover scale: `scale-[1.02]` cards, `scale-110` images

---

## 🔍 SEO & Metadata

Jewelry-specific SEO blocks highlight:
- Certified gold (18K-24K), GIA diamonds
- Hallmark assurance, insured delivery
- Bridal sets, engagement rings, heirloom pieces
- Filter copy: Carat, Clarity, Certification

**Meta Description Template**:  
_"Shop certified gold, diamonds, bridal sets, and fine jewelry at {Store} in {City}. Hallmark assured 18K-24K gold with GIA certifications and insured delivery."_

---

## 🚀 Performance Optimizations

1. **CSS-Only Animations**: No JavaScript for shimmer particles (12 floating divs with staggered delays)
2. **Reduced Motion**: `motion-reduce:hidden` on particles, slower carousel (12s vs 8s)
3. **Lazy Images**: `SmartProductImage` with responsive `sizes` per breakpoint
4. **Staggered Reveals**: 50-75ms delays vs simultaneous render for perceived smoothness
5. **Minimal Repaints**: Golden glow uses CSS `radial-gradient` overlays, not SVG filters

---

## 📱 Mobile Optimizations

- **Touch Gestures**: Swipe left/right on hero (50px threshold)
- **Bottom-Aligned Content**: Hero copy at bottom for thumb reach
- **3-Column Grid**: Category circles on mobile (vs 8-col desktop)
- **Compact Trust Strip**: 2-column on mobile (vs 4-col desktop)
- **Simplified Particles**: Fewer golden shimmers below `sm:` breakpoint

---

## ✅ Owner Configuration

Jewelry store owners can toggle sections via Store Settings:

```js
settings.storefront.jewellery = {
  animations: true,                  // Scroll reveals, particles
  showHeroRating: true,              // Social proof on hero
  showCertificationBadges: true,     // GIA/Hallmark badges on products
  showCollections: true,             // Curated collections carousel
  showSignaturePieces: true,         // Featured high-value jewelry
  showJewelleryEdit: true,           // "The Jewellery Edit" mosaic
  showCategories: true,              // Gold/Diamond/Bridal circles
  showNewArrivals: true,             // Latest pieces rail
  showOffers: true,                  // Sale jewelry
  showTrustStrip: true,              // Certification pillars
  showBrandsRow: true,               // Heritage brands marquee
  showSeoBlock: true,                // Expandable SEO content
  searchPlaceholder: 'Search gold, diamonds, bridal sets…',
  signaturePiecesTitle: 'Signature Pieces',
  signaturePiecesSubtitle: 'Handcrafted excellence',
  heroSlides: [],                    // Owner-uploaded hero images
  trustPillars: [],                  // Custom trust badges
  brands: [],                        // Custom brand overrides
}
```

---

## 🧪 Testing Checklist

- [ ] Hero carousel auto-advances (8s interval)
- [ ] Hero pauses on hover, hidden tab, reduced motion
- [ ] Touch swipe left/right changes slides
- [ ] Golden particles animate smoothly (12 elements)
- [ ] Parallax scroll on hero image (max 200px)
- [ ] Category circles scale + glow on hover
- [ ] Signature pieces show certification badges
- [ ] Trust strip shows 4 pillars with golden icons
- [ ] Mobile: 3-col categories, bottom hero content
- [ ] Desktop: 8-col categories, centered hero content
- [ ] Reduced motion: No particles, no parallax
- [ ] All images lazy-load with SmartProductImage
- [ ] Staggered reveals (50-75ms delay per item)
- [ ] Golden accent applied to CTAs, badges, accents

---

## 🎓 Best Practices

1. **Use High-Quality Images**: Jewelry photography should be close-up with clean backgrounds
2. **Populate Domain Data**: Always include carat, weight, certification for trust
3. **Certification First**: Highlight hallmark/GIA badges prominently
4. **Price Transparency**: Show compare_price for on-sale items
5. **Golden Accent**: Apply consistently across badges, CTAs, and hover states
6. **Mobile Testing**: Verify touch gestures and thumb reach on hero content
7. **Performance**: Monitor shimmer particles on lower-end devices
8. **Accessibility**: Ensure golden accent meets WCAG contrast ratios on white/dark backgrounds

---

## 📚 Related Documentation

- `docs/DOMAIN_VERTICALS.md` — gems-jewellery domain configuration
- `docs/AUDIT.md` — Data integrity for domain_data fields
- `lib/dataLab/jewelleryDemoCatalog.js` — Seed catalog with 27 SKUs
- `lib/domainData/specialized.js` — Jewelry field config (carat, clarity, hallmark)
- `components/storefront/sections/fashion/FashionHomeSections.jsx` — Fashion template for comparison

---

## 🔮 Future Enhancements

1. **3D Product Viewer**: WebGL jewelry viewer with 360° rotation
2. **Virtual Try-On**: AR overlay for rings, necklaces, earrings
3. **Diamond Visualizer**: Interactive clarity/cut/carat comparison tool
4. **Custom Engraving**: Real-time preview of personalized text
5. **Live Gold Rate**: Dynamic pricing based on 22K/24K gold market rates
6. **Wishlist with Alerts**: Price drop notifications for saved items
7. **Jewelry Care Guide**: Expandable tips per metal/gemstone type
8. **Appointment Booking**: In-store visit scheduling for bridal consultations

---

**Built with 2026 Design Principles**  
_Immersive · Trustworthy · Premium · Performance-Optimized_
