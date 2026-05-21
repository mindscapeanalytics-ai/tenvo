'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useWishlist } from '@/lib/hooks/storefront/useWishlist';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export function ProductCard({ product, businessDomain, variant = 'default' }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(product.id);
  
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        variantId: product.default_variant_id || null,
      });
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };
  
  const discount = product.compare_price && product.price < product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;
  
  const isLowStock = product.stock !== null && product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0 || product.stock === null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-white rounded-2xl overflow-hidden transition-all duration-300",
        "hover:shadow-xl border border-gray-100",
        variant === 'compact' ? 'p-3' : 'p-0'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link 
        href={`/store/${businessDomain}/products/${product.slug || product.id}`}
        className={cn(
          "relative block overflow-hidden bg-gray-100",
          variant === 'compact' ? 'aspect-square rounded-xl' : 'aspect-[4/5]'
        )}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && (
            <Badge className="bg-red-500 text-white border-0">
              -{discount}%
            </Badge>
          )}
          {product.is_new && (
            <Badge className="bg-blue-500 text-white border-0">
              New
            </Badge>
          )}
          {isLowStock && (
            <Badge className="bg-orange-500 text-white border-0">
              Only {product.stock} left
            </Badge>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className={cn(
          "absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        )}>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full shadow-lg",
              inWishlist && "bg-red-50 text-red-500"
            )}
            onClick={handleWishlist}
          >
            <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg"
            asChild
          >
            <Link href={`/store/${businessDomain}/products/${product.slug || product.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Out of Stock
            </Badge>
          </div>
        )}
        
        {/* Quick Add Button */}
        {!isOutOfStock && variant !== 'compact' && (
          <div className={cn(
            "absolute bottom-0 left-0 right-0 p-4 transition-all duration-300",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}>
            <Button 
              className="w-full gap-2 bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              <ShoppingBag className="w-4 h-4" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </Link>
      
      {/* Product Info */}
      <div className={cn(
        "space-y-2",
        variant === 'compact' ? 'mt-3' : 'p-4'
      )}>
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category_name}
          </p>
        )}
        
        {/* Name */}
        <Link 
          href={`/store/${businessDomain}/products/${product.slug || product.id}`}
          className="block"
        >
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.review_count})</span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-gray-900">
            {formatCurrency(product.price, product.currency || 'PKR')}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.compare_price, product.currency || 'PKR')}
            </span>
          )}
        </div>
        
        {/* Compact Add Button */}
        {variant === 'compact' && !isOutOfStock && (
          <Button 
            size="sm"
            className="w-full gap-2"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            <ShoppingBag className="w-4 h-4" />
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
