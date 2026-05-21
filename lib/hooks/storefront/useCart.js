'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { toast } from 'react-hot-toast';

const CART_STORAGE_KEY = 'tenvo_storefront_cart';

export function useCart() {
  const [cart, setCart] = useLocalStorage(CART_STORAGE_KEY, {
    items: [],
    businessId: null,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Sync with server when cart changes
  useEffect(() => {
    const syncCart = async () => {
      if (!cart.businessId || cart.items.length === 0) return;
      
      try {
        await fetch('/api/storefront/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: cart.businessId,
            items: cart.items,
          }),
        });
      } catch (err) {
        console.error('Cart sync failed:', err);
      }
    };
    
    const timeout = setTimeout(syncCart, 1000);
    return () => clearTimeout(timeout);
  }, [cart]);
  
  const addItem = useCallback(async ({ productId, quantity, variantId }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check stock availability
      const response = await fetch(`/api/storefront/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Item not available');
      }
      
      const { available, maxQuantity, product } = await response.json();
      
      if (!available) {
        throw new Error(`Only ${maxQuantity} items available`);
      }
      
      setCart(prev => {
        const existingIndex = prev.items.findIndex(
          item => item.productId === productId && item.variantId === variantId
        );
        
        let newItems;
        if (existingIndex >= 0) {
          // Update quantity
          newItems = [...prev.items];
          const newQuantity = newItems[existingIndex].quantity + quantity;
          
          if (newQuantity > maxQuantity) {
            throw new Error(`Maximum ${maxQuantity} items allowed`);
          }
          
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newQuantity,
          };
        } else {
          // Add new item
          newItems = [...prev.items, {
            productId,
            variantId,
            quantity,
            name: product.name,
            price: product.price,
            image: product.image_url,
            maxQuantity,
            addedAt: new Date().toISOString(),
          }];
        }
        
        return {
          ...prev,
          items: newItems,
          businessId: product.business_id,
          lastUpdated: new Date().toISOString(),
        };
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCart]);
  
  const updateQuantity = useCallback((productId, variantId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, [setCart]);
  
  const removeItem = useCallback((productId, variantId) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(
        item => !(item.productId === productId && item.variantId === variantId)
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, [setCart]);
  
  const clearCart = useCallback(() => {
    setCart({
      items: [],
      businessId: null,
      lastUpdated: null,
    });
  }, [setCart]);
  
  const calculateTotals = useCallback(() => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
    
    return {
      subtotal,
      itemCount,
      // Tax and shipping calculated at checkout
    };
  }, [cart.items]);
  
  return {
    cart,
    isLoading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    calculateTotals,
    isEmpty: cart.items.length === 0,
  };
}
