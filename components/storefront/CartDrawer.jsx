'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, 
  Truck, Package 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, updateQuantity, removeItem, calculateTotals, isLoading } = useCart();
  const { currency, formatPrice } = useStorefront();
  const { subtotal, itemCount } = calculateTotals();
  
  // Listen for cart toggle events
  useEffect(() => {
    const handleToggleCart = () => setIsOpen(true);
    window.addEventListener('toggle-cart', handleToggleCart);
    return () => window.removeEventListener('toggle-cart', handleToggleCart);
  }, []);
  
  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(item.productId, item.variantId);
      toast.success('Item removed from cart');
    } else if (newQuantity > item.maxQuantity) {
      toast.error(`Maximum ${item.maxQuantity} items available`);
    } else {
      updateQuantity(item.productId, item.variantId, newQuantity);
    }
  };
  
  const getBusinessDomain = () => {
    // Extract business domain from cart or context
    return cart.businessDomain || 'store';
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="space-y-2.5 pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="w-5 h-5" />
            Shopping Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>
        
        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added anything yet.
            </p>
            <Button onClick={() => setIsOpen(false)} asChild>
              <Link href={`/store/${getBusinessDomain()}/products`}>
                Continue Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <AnimatePresence mode="popLayout">
                {cart.items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${item.variantId}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Product Image */}
                    <Link 
                      href={`/store/${getBusinessDomain()}/products/${item.slug || item.productId}`}
                      className="flex-shrink-0"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/store/${getBusinessDomain()}/products/${item.slug || item.productId}`}
                        className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                      
                      {item.variantName && (
                        <p className="text-sm text-gray-500">{item.variantName}</p>
                      )}
                      
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price, currency)} each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={isLoading}
                            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={isLoading || item.quantity >= item.maxQuantity}
                            className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => {
                            removeItem(item.productId, item.variantId);
                            toast.success('Item removed');
                          }}
                          disabled={isLoading}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity, currency)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="border-t pt-4 space-y-4">
              {/* Free Shipping Progress */}
              {subtotal < 2000 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                    <Truck className="w-4 h-4" />
                    <span>Add {formatCurrency(2000 - subtotal, currency)} more for free shipping!</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (subtotal / 2000) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-xl font-bold">{formatCurrency(subtotal, currency)}</span>
              </div>
              
              <p className="text-sm text-gray-500">
                Shipping and taxes calculated at checkout
              </p>
              
              {/* CTA Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to checkout
                    window.location.href = `/store/${getBusinessDomain()}/checkout`;
                  }}
                >
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                  asChild
                >
                  <Link href={`/store/${getBusinessDomain()}/cart`}>
                    View Full Cart
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
