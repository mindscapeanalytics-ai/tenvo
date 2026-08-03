'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Check, AlertCircle, Minus, Plus, Heart, Share2, Zap, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useWishlist } from '@/lib/hooks/storefront/useWishlist';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStorefrontStockState } from '@/lib/storefront/storefrontStockUi';
import { resolveStorefrontVariantRequirement } from '@/lib/storefront/storefrontProductVariants';
import { isPharmacyElevatedStore } from '@/lib/storefront/pharmacyStorefront';
import { isPrescriptionRequiredProduct } from '@/lib/storefront/pharmacyProducts';
import { PharmacyPrescriptionCta } from '@/components/storefront/pharmacy/PharmacyPrescriptionCta';
import {
  isFitnessElevatedStore,
  isFitnessBookableProduct,
  resolveFitnessBookHref,
} from '@/lib/storefront/fitnessStorefront';
import { getTenantMeetingUrl } from '@/lib/storefront/storefrontBooking';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import {
  allowsFractionalStorefrontQty,
  storefrontQtyMin,
  storefrontQtyStep,
  normalizeStorefrontQty,
} from '@/lib/storefront/storefrontWeightQty';
import { toast } from 'react-hot-toast';

export function AddToCartSection({ product, businessDomain, selectedVariant = null }) {
  const weightItem = allowsFractionalStorefrontQty(product);
  const qtyStep = storefrontQtyStep(product);
  const qtyMin = storefrontQtyMin(product);
  const [quantity, setQuantity] = useState(weightItem ? 1 : 1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { currency, businessId, business, settings } = useStorefront();
  const isWishlisted = isInWishlist(product.id);
  const pharmacyStore = isPharmacyElevatedStore(business?.category);
  const requiresPrescription = pharmacyStore && isPrescriptionRequiredProduct(product);
  const fitnessStore = isFitnessElevatedStore(business?.category);
  const bookableFitness = fitnessStore && isFitnessBookableProduct(product);
  const meetingUrl = fitnessStore ? getTenantMeetingUrl(business, settings) : '';
  const bookHref = bookableFitness
    ? resolveFitnessBookHref(`/store/${businessDomain}`, {
        meetingUrl,
        subject: 'appointment',
        packageName: product.name,
      })
    : null;
  const accent = getStoreAccentColor(settings, business?.category);
  const variantRequirement = resolveStorefrontVariantRequirement(product);
  const requiresVariant = variantRequirement.required;
  const variantMissing = requiresVariant && !selectedVariant;
  const price = selectedVariant?.price || product.price;
  const { stock, isOutOfStock, isLowStock } = getStorefrontStockState(product, selectedVariant);
  
  // Intelligent quantity suggestions based on stock
  const quickQuantities = useCallback(() => {
    if (weightItem) {
      if (stock === null) return [0.5, 1, 1.5, 2];
      if (stock <= 0.5) return [qtyMin];
      if (stock <= 2) return [qtyMin, 1, stock].filter((v, i, a) => a.indexOf(v) === i && v <= stock);
      return [0.5, 1, 1.5, 2].filter((v) => v <= stock);
    }
    if (stock === null) return [1, 2, 5, 10];
    if (stock <= 1) return [1];
    if (stock <= 5) return [1, stock];
    if (stock <= 20) return [1, 2, 5, stock];
    return [1, 2, 5, 10];
  }, [stock, weightItem, qtyMin]);
  
  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // + and - keys for quantity
      if (e.key === '+' && !isOutOfStock) {
        setQuantity((prev) => {
          const next = normalizeStorefrontQty(prev + qtyStep, product);
          return stock != null ? Math.min(next, stock) : next;
        });
      }
      if (e.key === '-') {
        setQuantity((prev) => Math.max(qtyMin, normalizeStorefrontQty(prev - qtyStep, product)));
      }
      // Enter to add to cart
      if (e.key === 'Enter' && !isOutOfStock && !isAdding) {
        handleAddToCart();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stock, isOutOfStock, isAdding, qtyStep, qtyMin, product]);
  
  const handleQuantityChange = (value) => {
    const newQuantity = normalizeStorefrontQty(value, product);
    if (newQuantity >= qtyMin && (stock === null || newQuantity <= stock)) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = async () => {
    if (requiresPrescription) {
      window.location.href = `/store/${businessDomain}/contact?prescription=1&medicine=${encodeURIComponent(product.name || '')}`;
      return;
    }
    if (variantMissing) {
      toast.error('Please select all options before adding to cart');
      return;
    }
    if (isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        quantity,
        variantId: selectedVariant?.id || null,
        businessId,
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span>Added {quantity} item(s) to cart</span>
        </div>,
        { duration: 3000 }
      );
      
      // Dispatch event to open cart drawer
      window.dispatchEvent(new Event('toggle-cart'));
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };
  
  if (requiresPrescription) {
    return (
      <div className="space-y-4">
        <PharmacyPrescriptionCta
          product={product}
          businessDomain={businessDomain}
          accent={accent}
          variant="panel"
        />
      </div>
    );
  }

  if (bookableFitness && bookHref) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 px-4 py-3 text-sm text-rose-950">
          Memberships, classes, and coaching are booked with the gym. Cart checkout is for retail supplements and gear only.
        </div>
        <div className="flex gap-3">
          <a
            href={bookHref}
            target={meetingUrl ? '_blank' : undefined}
            rel={meetingUrl ? 'noopener noreferrer' : undefined}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-md transition hover:opacity-95"
            style={{ backgroundColor: accent }}
          >
            <Calendar className="h-5 w-5" aria-hidden />
            Book session
            {meetingUrl ? <ExternalLink className="h-4 w-4 opacity-80" aria-hidden /> : null}
          </a>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    'px-3 border-2',
                    isWishlisted && 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                  )}
                  onClick={() => (isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product))}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={isWishlisted}
                >
                  <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-center text-xs text-gray-400">
          Prefer talking to front desk? Use Book session to schedule a visit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium text-sm" htmlFor="quantity-input">
          Quantity{product.unit ? ` (${product.unit})` : ''}:
        </label>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => handleQuantityChange(quantity - qtyStep)}
            disabled={quantity <= qtyMin}
            className="p-3 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <Input
            id="quantity-input"
            type="number"
            min={qtyMin}
            max={stock || 999}
            step={qtyStep}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-16 text-center border-0 focus-visible:ring-0 p-0"
            aria-label="Product quantity"
          />
          <button
            onClick={() => handleQuantityChange(quantity + qtyStep)}
            disabled={stock !== null && quantity >= stock}
            className="p-3 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick quantity buttons for retail efficiency */}
        <div className="flex gap-1" role="group" aria-label="Quick quantity options">
          {quickQuantities().map((qty) => (
            <button
              key={qty}
              onClick={() => setQuantity(qty)}
              className={cn(
                "px-2 py-1 text-xs rounded border transition-colors focus:ring-2 focus:ring-brand-primary",
                quantity === qty
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
              aria-label={`Set quantity to ${qty}`}
              aria-pressed={quantity === qty}
            >
              {qty}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stock Status with Accessibility */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {isOutOfStock ? (
          <Badge variant="destructive" className="text-sm py-1 px-3" aria-label="Product is out of stock">
            <AlertCircle className="w-3 h-3 mr-1" />
            Out of Stock
          </Badge>
        ) : isLowStock ? (
          <div className="flex items-center gap-2 text-orange-600 text-sm" aria-label={`Low stock warning: only ${stock} items remaining`}>
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="font-medium">Only {stock} left in stock - order soon</span>
          </div>
        ) : stock !== null ? (
          <p className="text-sm text-green-600 flex items-center gap-2" aria-label={`${stock} items available in stock`}>
            <Check className="w-4 h-4" />
            In Stock ({stock} available)
          </p>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-2" aria-label="Stock availability unknown">
            <Check className="w-4 h-4" />
            Available
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className={cn(
            "flex-1 gap-2 text-lg focus:ring-4 focus:ring-brand-primary/30",
            isOutOfStock && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock || variantMissing}
          aria-label={
            variantMissing
              ? 'Select product options before adding to cart'
              : isOutOfStock
                ? 'Product out of stock'
                : `Add ${quantity} to cart for ${formatCurrency(price * quantity, currency)}`
          }
        >
          {isAdding ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              {variantMissing
                ? 'Select options'
                : isOutOfStock
                  ? 'Out of Stock'
                  : `Add to Cart - ${formatCurrency(price * quantity, currency)}`}
            </>
          )}
        </Button>
        
        {/* Wishlist button for retail engagement */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "px-3 border-2",
                  isWishlisted && "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                )}
                onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Keyboard shortcuts hint */}
      <p className="text-xs text-gray-400 text-center">
        Use +/- keys for quantity, Enter to add to cart
      </p>
    </div>
  );
}
