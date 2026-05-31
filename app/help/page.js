import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';

export const metadata = {
  title: 'Help Center',
  description: 'Get started with TENVO: features, pricing, demos, and support.',
};

export default function HelpPage() {
  const items = [
    { href: '/features', label: 'Core features', desc: 'Storefront, POS, inventory, accounting, and compliance positioning.' },
    { href: '/why-tenvo', label: 'Why TENVO', desc: 'How we compare to stitched storefront-only or global bundles.' },
    { href: '/pricing', label: 'Pricing', desc: 'Plans and currencies for your market.' },
    { href: '/demo', label: 'Book a demo', desc: 'Walk through with our team.' },
    { href: '/contact', label: 'Contact support', desc: 'Billing, onboarding, and technical questions.' },
    { href: '/integrations', label: 'Integrations', desc: 'Channels, payments, and carriers we talk about on the site.' },
  ];

  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Help Center</h1>
          <p className="mt-4 text-sm font-medium text-neutral-600">
            Signed-in product help lives inside your workspace after you{' '}
            <Link href="/register" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              register
            </Link>
            . Start here on the public site:
          </p>
          <ul className="mt-10 space-y-4">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 transition-colors hover:border-brand-primary/40 hover:bg-white"
                >
                  <span className="font-black text-neutral-900">{item.label}</span>
                  <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MarketingLayout>
  );
}
