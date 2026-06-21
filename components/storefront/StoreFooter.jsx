'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin,
  CreditCard, Shield, Truck, RotateCcw, Send, ExternalLink
} from 'lucide-react';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { toast } from 'react-hot-toast';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { resolveStoreContact } from '@/lib/storefront/businessContact';

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 lg:mb-4 lg:text-sm lg:text-white">
        {title}
      </h4>
      <ul className="space-y-1.5 lg:space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-xs text-gray-400 transition-colors hover:text-white lg:text-sm"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StoreFooter({ business, settings }) {
  const { businessDomain, currency } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const storeName = business?.business_name || 'Store';
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const freeShippingThreshold = settings?.freeShippingThreshold || 2000;
  const returnDays = settings?.returnPolicyDays || 7;
  const contact = resolveStoreContact({ business, settings });

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/storefront/${businessDomain}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        toast.success('Thanks for subscribing!');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to subscribe. Try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: Facebook, href: settings?.socialLinks?.facebook || settings?.social?.facebook, label: 'Facebook' },
    { icon: Instagram, href: settings?.socialLinks?.instagram || settings?.social?.instagram, label: 'Instagram' },
    { icon: Twitter, href: settings?.socialLinks?.twitter || settings?.social?.twitter, label: 'Twitter / X' },
    { icon: Youtube, href: settings?.socialLinks?.youtube || settings?.social?.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  const shopLinks = [
    { label: 'All Products', href: `/store/${businessDomain}/products` },
    { label: 'New Arrivals', href: `/store/${businessDomain}/products?sort=newest` },
    { label: 'On Sale', href: `/store/${businessDomain}/products?onSale=true` },
    { label: 'Featured', href: `/store/${businessDomain}/products?sort=featured` },
  ];

  const supportLinks = [
    { label: 'Track Order', href: `/store/${businessDomain}/orders` },
    { label: 'Shipping', href: `/store/${businessDomain}/shipping` },
    { label: 'Returns', href: `/store/${businessDomain}/returns` },
    { label: 'FAQs', href: `/store/${businessDomain}/faqs` },
    { label: 'Contact', href: `/store/${businessDomain}/contact` },
  ];

  const tagline =
    business?.description ||
    `Quality products from ${storeName}. Secure checkout and reliable service.`;

  return (
    <footer className="bg-gray-950 text-gray-400 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Trust strip — tablet+ */}
      <div className="hidden md:block border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { icon: Truck, color: 'text-blue-400', title: 'Free Shipping', sub: `Orders over ${formatCurrency(freeShippingThreshold, currency)}` },
              { icon: Shield, color: 'text-green-400', title: 'Secure Payment', sub: '256-bit SSL encryption' },
              { icon: RotateCcw, color: 'text-orange-400', title: `${returnDays}-Day Returns`, sub: 'Hassle-free returns' },
              { icon: CreditCard, color: 'text-purple-400', title: 'Multiple Payments', sub: 'Cards, COD, Wallets' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <item.icon className={cn('h-6 w-6 shrink-0 lg:h-7 lg:w-7', item.color)} />
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Mobile trust pills */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-800 pb-4 text-[10px] text-gray-500 md:hidden">
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden />
            Free over {formatCurrency(freeShippingThreshold, currency, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-gray-700" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <RotateCcw className="h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden />
            {returnDays}-day returns
          </span>
          <span className="text-gray-700" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden />
            Secure checkout
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-5 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 space-y-3 lg:col-span-2 lg:space-y-5">
            <div className="flex items-center gap-2.5">
              {business?.logo_url ? (
                <SmartProductImage
                  src={business.logo_url}
                  alt={storeName}
                  width={120}
                  height={36}
                  className="h-8 w-auto object-contain lg:h-9"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white lg:h-9 lg:w-9 lg:rounded-xl lg:text-base"
                  style={{ backgroundColor: accent }}
                >
                  {storeName.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="truncate text-base font-black text-white lg:text-lg">{storeName}</span>
            </div>

            <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 lg:line-clamp-none lg:max-w-xs lg:text-sm lg:text-gray-400">
              {tagline}
            </p>

            <div className="flex flex-wrap gap-2">
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-gray-300 transition-colors hover:text-white lg:bg-transparent lg:p-0 lg:text-sm"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                </a>
              ) : null}
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-gray-300 transition-colors hover:text-white lg:bg-transparent lg:p-0 lg:text-sm"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </a>
              ) : null}
              {contact.whatsappUrl ? (
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-gray-300 transition-colors hover:text-white lg:bg-transparent lg:p-0 lg:text-sm"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>

            {contact.fullAddress ? (
              <div className="hidden items-start gap-2 text-sm lg:flex">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{contact.fullAddress}</span>
              </div>
            ) : null}

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5 lg:gap-2 lg:pt-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 transition-colors hover:bg-gray-800 lg:h-9 lg:w-9 lg:rounded-xl"
                  >
                    <s.icon className="h-3.5 w-3.5 text-gray-300 lg:h-4 lg:w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <FooterLinkColumn title="Shop" links={shopLinks} />
          <FooterLinkColumn title="Support" links={supportLinks} />

          {/* Newsletter — desktop only */}
          <div className="hidden lg:block">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Stay Updated
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Offers and updates from {storeName}.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 pr-12 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': accent }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                  aria-label="Subscribe"
                >
                  {submitting ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600">No spam. Unsubscribe anytime.</p>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-gray-800 pt-4 text-center lg:mt-12 lg:flex-row lg:justify-between lg:gap-4 lg:pt-6 lg:text-left">
          <p className="text-[10px] text-gray-600 lg:text-xs">
            © {currentYear}{' '}
            <span className="font-medium text-gray-400">{storeName}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-gray-600 lg:gap-4 lg:text-xs">
            <Link href={`/store/${businessDomain}/privacy`} className="transition-colors hover:text-gray-400">
              Privacy
            </Link>
            <span className="text-gray-800" aria-hidden>·</span>
            <Link href={`/store/${businessDomain}/terms`} className="transition-colors hover:text-gray-400">
              Terms
            </Link>
            {business?.website && (
              <>
                <span className="text-gray-800" aria-hidden>·</span>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-400"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
