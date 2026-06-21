import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MarketingPageHeader, MarketingSection } from '@/components/marketing/layout/MarketingSection';

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
      <MarketingPageHeader
        title="Help Center"
        description={
          <>
            Signed-in product help lives inside your workspace after you{' '}
            <Link href="/register" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              register
            </Link>
            . Start here on the public site:
          </>
        }
      />

      <MarketingSection className="bg-neutral-50/50" padding="default" width="narrow">
        <ul className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-brand-primary/40 sm:p-5"
              >
                <span className="font-black text-neutral-900">{item.label}</span>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </MarketingLayout>
  );
}
