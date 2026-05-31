import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';

export const metadata = {
  title: 'Documentation',
  description: 'TENVO documentation overview: public guides and authenticated API access.',
};

export default function DocsPage() {
  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Documentation</h1>
          <div className="mt-8 space-y-6 text-sm font-medium leading-relaxed text-neutral-700">
            <p>
              Product tours and capability pages live under{' '}
              <Link href="/features" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                Features
              </Link>{' '}
              and{' '}
              <Link href="/integrations" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                Integrations
              </Link>
              . For tenant-specific REST access, authenticated routes are available under{' '}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">/api/v1</code> after you sign in to
              your business workspace.
            </p>
            <p>
              Need a tailored integration map for your stack?{' '}
              <Link href="/demo" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                Book a demo
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                contact sales
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
