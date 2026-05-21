'use client';

import Link from 'next/link';
import { 
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin,
  CreditCard, Shield, Truck, RotateCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { toast } from 'react-hot-toast';

export function StoreFooter({ business, settings }) {
  const { businessDomain } = useStorefront();
  const currentYear = new Date().getFullYear();
  
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you for subscribing!');
    e.target.reset();
  };
  
  const footerLinks = {
    shop: [
      { label: 'All Products', href: `/store/${businessDomain}/products` },
      { label: 'New Arrivals', href: `/store/${businessDomain}/products?sort=newest` },
      { label: 'On Sale', href: `/store/${businessDomain}/products?onSale=true` },
      { label: 'Best Sellers', href: `/store/${businessDomain}/products?sort=popularity` },
    ],
    support: [
      { label: 'Contact Us', href: `/store/${businessDomain}/contact` },
      { label: 'FAQs', href: `/store/${businessDomain}/faqs` },
      { label: 'Shipping Info', href: `/store/${businessDomain}/shipping` },
      { label: 'Returns & Exchanges', href: `/store/${businessDomain}/returns` },
    ],
    company: [
      { label: 'About Us', href: `/store/${businessDomain}/about` },
      { label: 'Privacy Policy', href: `/store/${businessDomain}/privacy` },
      { label: 'Terms of Service', href: `/store/${businessDomain}/terms` },
    ],
  };
  
  const socialLinks = [
    { icon: Facebook, href: settings?.social?.facebook, label: 'Facebook' },
    { icon: Instagram, href: settings?.social?.instagram, label: 'Instagram' },
    { icon: Twitter, href: settings?.social?.twitter, label: 'Twitter' },
    { icon: Youtube, href: settings?.social?.youtube, label: 'Youtube' },
  ].filter(link => link.href);
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Trust Badges */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-400" />
              <div>
                <p className="font-semibold text-white">Free Shipping</p>
                <p className="text-sm text-gray-400">On orders over Rs. 2000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-400" />
              <div>
                <p className="font-semibold text-white">Secure Payment</p>
                <p className="text-sm text-gray-400">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-8 h-8 text-orange-400" />
              <div>
                <p className="font-semibold text-white">Easy Returns</p>
                <p className="text-sm text-gray-400">7-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-400" />
              <div>
                <p className="font-semibold text-white">Multiple Payments</p>
                <p className="text-sm text-gray-400">Cards, COD, Wallets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">{business.business_name}</h3>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              {business.description || `Your trusted online store for quality products. Shop with confidence and enjoy a seamless shopping experience.`}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  {business.email}
                </a>
              )}
              {business.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{business.address}, {business.city}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-white mb-4">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe for exclusive offers and updates.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <Separator className="my-8 bg-gray-800" />
        
        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} {business.business_name}. All rights reserved.
          </p>
          
          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
