'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, Search, Menu, X, User, Heart, 
  Phone, MapPin, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { SearchBar } from './SearchBar';
import { MobileNav } from './MobileNav';
import { CategoryNav } from './CategoryNav';

export function StoreHeader({ business, categories, settings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { cart } = useCart();
  const { businessDomain } = useStorefront();
  
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const topBarEnabled = settings?.storefront?.showTopBar !== false;
  const primaryColor = settings?.brand?.primaryColor || '#c49c3b';
  
  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      {topBarEnabled && (
        <div 
          className="bg-gray-900 text-white py-2 px-4 text-sm"
          style={{ backgroundColor: settings?.brand?.topBarColor || '#1f2937' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {settings?.contact?.phone && (
                <a 
                  href={`tel:${settings.contact.phone}`}
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">{settings.contact.phone}</span>
                </a>
              )}
              {settings?.contact?.address && (
                <span className="hidden md:flex items-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {settings.contact.address}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {settings?.announcement && (
                <span className="text-xs font-medium">
                  {settings.announcement}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Header */}
      <div 
        className={cn(
          "bg-white border-b transition-all duration-300",
          isScrolled ? "shadow-md py-2" : "py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link 
              href={`/store/${businessDomain}`}
              className="flex items-center gap-2 flex-shrink-0"
            >
              {business.logo_url ? (
                <img 
                  src={business.logo_url} 
                  alt={business.business_name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {business.business_name?.charAt(0)}
                </div>
              )}
              <span className={cn(
                "font-bold text-gray-900 hidden sm:block",
                isScrolled ? "text-lg" : "text-xl"
              )}>
                {business.business_name}
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <CategoryNav categories={categories} />
            </nav>
            
            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
              
              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                asChild
              >
                <Link href={`/store/${businessDomain}/account/wishlist`}>
                  <Heart className="w-5 h-5" />
                </Link>
              </Button>
              
              {/* Account */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                asChild
              >
                <Link href={`/store/${businessDomain}/account`}>
                  <User className="w-5 h-5" />
                </Link>
              </Button>
              
              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                asChild
              >
                <Link href={`/store/${businessDomain}/cart`}>
                  <ShoppingBag className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              
              {/* Mobile Menu */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <SearchBar 
          onClose={() => setIsSearchOpen(false)} 
          businessDomain={businessDomain}
        />
      )}
      
      {/* Mobile Menu */}
      <MobileNav 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
        businessDomain={businessDomain}
      />
    </header>
  );
}
