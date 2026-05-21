'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ChevronRight, Home, ShoppingBag, User, Heart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { useCart } from '@/lib/hooks/storefront/useCart';

export function MobileNav({ isOpen, onClose, categories, businessDomain }) {
  const [expandedCategories, setExpandedCategories] = useState(false);
  const { cart } = useCart();
  
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  const mainLinks = [
    { label: 'Home', href: `/store/${businessDomain}`, icon: Home },
    { label: 'Shop', href: `/store/${businessDomain}/products`, icon: ShoppingBag },
    { label: 'Account', href: `/store/${businessDomain}/account`, icon: User },
    { label: 'Wishlist', href: `/store/${businessDomain}/account/wishlist`, icon: Heart },
  ];
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-sm p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              {mainLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                      link.label === 'Shop' && cartItemCount > 0 && "justify-between"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{link.label}</span>
                    </div>
                    {link.label === 'Shop' && cartItemCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Categories */}
            {categories && categories.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setExpandedCategories(!expandedCategories)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold">Categories</span>
                  <ChevronRight className={cn(
                    "w-5 h-5 transition-transform",
                    expandedCategories && "rotate-90"
                  )} />
                </button>
                
                {expandedCategories && (
                  <ul className="space-y-1 px-4">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/store/${businessDomain}/products?category=${category.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between py-2 pl-8 text-gray-600 hover:text-gray-900"
                        >
                          <span>{category.name}</span>
                          <span className="text-sm text-gray-400">({category.product_count})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t space-y-3">
            <Button 
              className="w-full gap-2" 
              size="lg"
              asChild
            >
              <Link href={`/store/${businessDomain}/products`} onClick={onClose}>
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
