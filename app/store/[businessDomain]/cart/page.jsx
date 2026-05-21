'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, ArrowRight, Trash2, Plus, Minus, 
  AlertCircle, Truck, Percent 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage({ params }) {
  const { businessDomain } = params;
  const router = useRouter();
  const { cart, updateQuantity, removeItem, isLoading, calculateTotals } = useCart();
  const { currency, formatPrice, businessName } = useStorefront();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  
  const { subtotal, itemCount } = calculateTotals();
  
  // Calculate shipping
  const shippingCosts = {
    standard: subtotal > 2000 ? 0 : 150,
    express: 300,
    pickup: 0,
  };
  
  const shipping = shippingCosts[shippingMethod];
  const tax = subtotal * 0.17; // 17% GST for Pakistan
  const total = subtotal + shipping + tax;
  
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
  
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    setPromoError('');
    
    try {
      const response = await fetch(`/api/storefront/${businessDomain}/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, subtotal }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid promo code');
      }
      
      const data = await response.json();
      toast.success(`Promo code applied! Save ${formatCurrency(data.discount, currency)}`);
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setIsApplyingPromo(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 animate-pulse" />
          <p className="mt-4 text-gray-500">Loading cart...</p>
        </div>
      </div>
    );
  }
  
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button 
            size="lg"
            className="gap-2"
            asChild
          >
            <Link href={`/store/${businessDomain}/products`}>
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.items.map((item) => (
                <motion.div
                  key={`${item.productId}-${item.variantId}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link 
                      href={`/store/${businessDomain}/products/${item.slug || item.productId}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/store/${businessDomain}/products/${item.slug || item.productId}`}
                        className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      
                      {item.variantName && (
                        <p className="text-sm text-gray-500 mt-1">
                          {item.variantName}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            disabled={isLoading}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                            disabled={isLoading || item.quantity >= item.maxQuantity}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            removeItem(item.productId, item.variantId);
                            toast.success('Item removed');
                          }}
                          className="text-red-500 hover:text-red-700 p-2"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Stock Warning */}
                      {item.maxQuantity <= 5 && item.maxQuantity > 0 && (
                        <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Only {item.maxQuantity} left in stock
                        </p>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(item.price * item.quantity, currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price, currency)} each
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Continue Shopping */}
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/store/${businessDomain}/products`}>
                <ArrowRight className="w-4 h-4 rotate-180" />
                Continue Shopping
              </Link>
            </Button>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  
                  {/* Shipping Method */}
                  <div className="space-y-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="shipping"
                          value="standard"
                          checked={shippingMethod === 'standard'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Standard Delivery</p>
                          <p className="text-sm text-gray-500">3-5 business days</p>
                        </div>
                        <span className="font-medium">
                          {shippingCosts.standard === 0 ? 'FREE' : formatCurrency(shippingCosts.standard, currency)}
                        </span>
                      </label>
                      
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="shipping"
                          value="express"
                          checked={shippingMethod === 'express'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Express Delivery</p>
                          <p className="text-sm text-gray-500">1-2 business days</p>
                        </div>
                        <span className="font-medium">{formatCurrency(shippingCosts.express, currency)}</span>
                      </label>
                      
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="shipping"
                          value="pickup"
                          checked={shippingMethod === 'pickup'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Store Pickup</p>
                          <p className="text-sm text-gray-500">Ready in 2 hours</p>
                        </div>
                        <span className="font-medium text-green-600">FREE</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Tax */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (17% GST)</span>
                    <span className="font-medium">{formatCurrency(tax, currency)}</span>
                  </div>
                  
                  <Separator />
                  
                  {/* Promo Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="uppercase"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode.trim()}
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-600">{promoError}</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                  
                  {/* Checkout Button */}
                  <Button 
                    size="lg"
                    className="w-full gap-2 text-lg"
                    onClick={() => router.push(`/store/${businessDomain}/checkout`)}
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  
                  {/* Trust Badges */}
                  <div className="flex justify-center gap-4 pt-4 text-gray-400">
                    <span className="text-xs">Secure Checkout</span>
                    <span className="text-xs">•</span>
                    <span className="text-xs">SSL Encrypted</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Help */}
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-800">
                    Need help?{' '}
                    <Link 
                      href={`/store/${businessDomain}/contact`}
                      className="font-medium underline"
                    >
                      Contact us
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
