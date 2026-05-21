'use client';

import { useState } from 'react';
import { ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { toast } from 'react-hot-toast';

export function AddToCartSection({ product, businessDomain, selectedVariant = null }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const { currency } = useStorefront();
  
  // Determine price and stock
  const price = selectedVariant?.price || product.price;
  const stock = selectedVariant?.stock !== undefined 
    ? selectedVariant.stock 
    : product.stock;
  const isOutOfStock = stock === 0;
  const isLowStock = stock !== null && stock <= 5 && stock > 0;
  
  const handleQuantityChange = (value) => {
    const newQuantity = parseInt(value) || 1;
    if (newQuantity >= 1 && (stock === null || newQuantity <= stock)) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = async () => {
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
  
  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium text-sm">Quantity:</label>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="p-3 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50"
          >
            -
          </button>
          <Input
            type="number"
            min={1}
            max={stock || 999}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-16 text-center border-0 focus-visible:ring-0 p-0"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={stock !== null && quantity >= stock}
            className="p-3 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Stock Status */}
      {isOutOfStock ? (
        <Badge variant="destructive" className="text-sm py-1 px-3">
          Out of Stock
        </Badge>
      ) : isLowStock ? (
        <div className="flex items-center gap-2 text-orange-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Only {stock} left in stock - order soon</span>
        </div>
      ) : stock !== null ? (
        <p className="text-sm text-green-600 flex items-center gap-2">
          <Check className="w-4 h-4" />
          In Stock ({stock} available)
        </p>
      ) : null}
      
      {/* Add to Cart Button */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className={cn(
            "flex-1 gap-2 text-lg",
            isOutOfStock && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
        >
          {isAdding ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              {isOutOfStock ? 'Out of Stock' : `Add to Cart - ${formatCurrency(price * quantity, currency)}`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
