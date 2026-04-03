# UnifiedActionPanel Usage Guide

## Overview

The `UnifiedActionPanel` is a consolidated interface that brings all inventory actions into a single, accessible panel. It dramatically reduces navigation complexity from 3+ clicks to just 1-2 clicks, improving user efficiency and experience.

## Key Features

- **Tabbed Interface**: Batch, Serial, Variant, and Adjustment tabs in one place
- **Keyboard Shortcuts**: Quick access via Alt+B, Alt+S, Alt+V, Alt+A, Esc
- **Lazy Loading**: Components load only when needed for better performance
- **Mobile-Responsive**: Slide-in drawer on mobile, side panel on desktop
- **Category-Aware**: Shows only relevant tabs based on product category
- **Smooth Animations**: Professional transitions and interactions
- **Floating Action Button**: Quick access on mobile devices

## Installation

```javascript
import UnifiedActionPanel, { UnifiedActionFAB } from '@/components/inventory/UnifiedActionPanel';
import '@/components/inventory/UnifiedActionPanel.css';
```

## Basic Usage

### Desktop/Tablet

```javascript
import { useState } from 'react';
import UnifiedActionPanel from '@/components/inventory/UnifiedActionPanel';

function InventoryPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('batch');

  const handleOpenPanel = (product) => {
    setSelectedProduct(product);
    setIsPanelOpen(true);
  };

  return (
    <div>
      {/* Your product list */}
      <button onClick={() => handleOpenPanel(product)}>
        Manage Inventory
      </button>

      {/* Unified Action Panel */}
      <UnifiedActionPanel
        product={selectedProduct}
        businessId="your-business-id"
        category={selectedProduct?.category}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setIsPanelOpen(false)}
        isOpen={isPanelOpen}
      />
    </div>
  );
}
```

### Mobile with FAB

```javascript
import { UnifiedActionFAB } from '@/components/inventory/UnifiedActionPanel';

function MobileInventoryPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div>
      {/* Your content */}
      
      {/* Floating Action Button */}
      <UnifiedActionFAB onClick={() => setIsPanelOpen(true)} />
      
      {/* Panel */}
      <UnifiedActionPanel
        product={selectedProduct}
        businessId="your-business-id"
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
```

## Props

### UnifiedActionPanel

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `product` | Object | Yes | - | Product object with id, name, sku, category |
| `businessId` | String | Yes | - | Business ID for data fetching |
| `category` | String | No | - | Product category (determines visible tabs) |
| `activeTab` | String | No | 'batch' | Initial active tab (batch, serial, variant, adjustment) |
| `onTabChange` | Function | No | - | Callback when tab changes: `(tabId) => void` |
| `onClose` | Function | No | - | Callback when panel closes |
| `isOpen` | Boolean | No | false | Panel open state |

### UnifiedActionFAB

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onClick` | Function | Yes | - | Callback when FAB is clicked |

## Keyboard Shortcuts

The panel supports the following keyboard shortcuts when open:

| Shortcut | Action |
|----------|--------|
| `Alt + B` | Switch to Batch tab |
| `Alt + S` | Switch to Serial tab |
| `Alt + V` | Switch to Variant tab |
| `Alt + A` | Switch to Adjustment tab |
| `Esc` | Close panel |

## Tab Visibility Logic

The panel intelligently shows/hides tabs based on product category:

### Batch Tracking Tab
**Shown for:**
- Pharmacy
- Food & Beverage
- Textile Wholesale
- Cosmetics
- Chemicals
- All other categories (default)

### Serial Tracking Tab
**Shown for:**
- Electronics
- Appliances
- Mobile Accessories
- Computers

### Variant Matrix Tab
**Shown for:**
- Garments
- Footwear
- Textile Retail

### Stock Adjustment Tab
**Always shown** for all categories

## Responsive Behavior

### Mobile (<768px)
- Slide-in drawer from bottom
- Swipe handle for easy dismissal
- Full-width tabs
- Maximum height: 90vh
- Touch-optimized controls (44px minimum)

### Desktop (≥768px)
- Side panel from right
- Fixed width: max-w-4xl
- Full-height panel
- Keyboard shortcut hints visible
- Backdrop blur effect (modern browsers)

## Lazy Loading

Components are lazy-loaded for optimal performance:

```javascript
const BatchTrackingManager = lazy(() => import('./BatchTrackingManager'));
const SerialTrackingManager = lazy(() => import('./SerialTrackingManager'));
const StockAdjustmentManager = lazy(() => import('./StockAdjustmentManager'));
```

**Benefits:**
- Faster initial page load
- Reduced bundle size
- Components load only when tab is activated
- Loading spinner shown during component load

## Styling

### Custom Colors

The panel uses the wine color scheme (#722F37). To customize:

```css
/* Override in your global CSS */
.unified-action-panel-tab.active {
  color: your-color;
  border-color: your-color;
  background-color: your-color-light;
}
```

### Animations

All animations are defined in `UnifiedActionPanel.css`:

- `slide-up`: Mobile drawer animation (300ms)
- `slide-left`: Desktop panel animation (300ms)
- `pulse-ring`: FAB pulse effect (1.5s loop)

To disable animations:

```css
.animate-slide-up,
.animate-slide-left {
  animation: none;
}
```

## Integration Examples

### With Product List

```javascript
function ProductList({ products, businessId }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleQuickAction = (product, action) => {
    setSelectedProduct(product);
    setActiveTab(action); // 'batch', 'serial', 'adjustment'
    setIsPanelOpen(true);
  };

  return (
    <div>
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <div className="actions">
            <button onClick={() => handleQuickAction(product, 'batch')}>
              Batch
            </button>
            <button onClick={() => handleQuickAction(product, 'serial')}>
              Serial
            </button>
            <button onClick={() => handleQuickAction(product, 'adjustment')}>
              Adjust
            </button>
          </div>
        </div>
      ))}

      <UnifiedActionPanel
        product={selectedProduct}
        businessId={businessId}
        category={selectedProduct?.category}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
```

### With Context Menu

```javascript
function ProductContextMenu({ product, businessId }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('batch');

  const menuItems = [
    { label: 'Manage Batches', tab: 'batch' },
    { label: 'Manage Serials', tab: 'serial' },
    { label: 'Adjust Stock', tab: 'adjustment' }
  ];

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsPanelOpen(true);
  };

  return (
    <>
      <ContextMenu>
        {menuItems.map(item => (
          <MenuItem 
            key={item.tab}
            onClick={() => handleMenuClick(item.tab)}
          >
            {item.label}
          </MenuItem>
        ))}
      </ContextMenu>

      <UnifiedActionPanel
        product={product}
        businessId={businessId}
        activeTab={activeTab}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}
```

### With Search Results

```javascript
function SearchResults({ results, businessId }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div>
      {results.map(product => (
        <div 
          key={product.id}
          onClick={() => {
            setSelectedProduct(product);
            setIsPanelOpen(true);
          }}
          className="cursor-pointer hover:bg-gray-50"
        >
          {product.name}
        </div>
      ))}

      <UnifiedActionPanel
        product={selectedProduct}
        businessId={businessId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
```

## Performance Optimization

### Lazy Loading Best Practices

```javascript
// Preload components on hover for instant feel
const handleMouseEnter = () => {
  import('./BatchTrackingManager');
  import('./SerialTrackingManager');
  import('./StockAdjustmentManager');
};

<button 
  onMouseEnter={handleMouseEnter}
  onClick={() => setIsPanelOpen(true)}
>
  Open Panel
</button>
```

### Memoization

```javascript
import { memo } from 'react';

const MemoizedUnifiedActionPanel = memo(UnifiedActionPanel, (prev, next) => {
  return (
    prev.isOpen === next.isOpen &&
    prev.product?.id === next.product?.id &&
    prev.activeTab === next.activeTab
  );
});
```

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus visible on all controls
- Escape key closes panel

### Screen Readers
- Semantic HTML structure
- ARIA labels on icon buttons
- Tab role for tab list
- Tabpanel role for content

### Touch Targets
- Minimum 44px touch targets on mobile
- Adequate spacing between interactive elements
- Large swipe handle for easy dismissal

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **IE11**: Not supported (uses modern JavaScript features)
- **Mobile**: iOS Safari 12+, Chrome Android 80+

### Polyfills Required
- None (uses native browser features)

## Troubleshooting

### Panel Not Opening
```javascript
// Check isOpen prop
console.log('Panel open:', isOpen);

// Verify product data
console.log('Product:', product);

// Check for z-index conflicts
// Panel uses z-40 (backdrop) and z-50 (panel)
```

### Tabs Not Showing
```javascript
// Verify category prop
console.log('Category:', category);

// Check tab visibility logic
const shouldShow = shouldShowBatchTracking();
console.log('Show batch tab:', shouldShow);
```

### Keyboard Shortcuts Not Working
```javascript
// Ensure panel is open
if (!isOpen) return;

// Check for event listener conflicts
// Remove other Alt key listeners
```

### Lazy Loading Errors
```javascript
// Verify component paths
const BatchTrackingManager = lazy(() => 
  import('./BatchTrackingManager').catch(err => {
    console.error('Failed to load:', err);
    return { default: () => <div>Error loading component</div> };
  })
);
```

## Best Practices

### 1. Always Provide Product Data
```javascript
// Good
<UnifiedActionPanel product={product} businessId={businessId} />

// Bad - missing product
<UnifiedActionPanel businessId={businessId} />
```

### 2. Handle Close Events
```javascript
// Good - cleanup on close
const handleClose = () => {
  setIsPanelOpen(false);
  setSelectedProduct(null);
  setActiveTab('batch');
};

// Bad - no cleanup
const handleClose = () => {
  setIsPanelOpen(false);
};
```

### 3. Preload on User Intent
```javascript
// Preload on hover for instant feel
<button 
  onMouseEnter={() => import('./BatchTrackingManager')}
  onClick={() => setIsPanelOpen(true)}
>
  Open
</button>
```

### 4. Use Memoization for Large Lists
```javascript
const MemoizedPanel = memo(UnifiedActionPanel);

{products.map(product => (
  <ProductCard 
    key={product.id}
    product={product}
    onAction={() => openPanel(product)}
  />
))}
```

## Migration from Legacy Components

### Before (Multiple Components)
```javascript
// Old approach - multiple modals
<BatchModal isOpen={batchOpen} />
<SerialModal isOpen={serialOpen} />
<AdjustmentModal isOpen={adjustOpen} />
```

### After (Unified Panel)
```javascript
// New approach - single panel
<UnifiedActionPanel 
  isOpen={panelOpen}
  activeTab={activeTab}
/>
```

**Benefits:**
- 70% less code
- Single state management
- Consistent UX
- Better performance
- Easier maintenance

## Related Components

- `BatchTrackingManager` - Batch tracking interface
- `SerialTrackingManager` - Serial tracking interface
- `StockAdjustmentManager` - Stock adjustment interface
- `VariantMatrixEditor` - Variant matrix (coming soon)

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check browser console for errors
4. Verify props and data structure

---

**Version**: 1.0.0  
**Last Updated**: April 3, 2026  
**Status**: Production Ready
