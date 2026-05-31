import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';

export const metadata = {
  title: 'System Status',
  description: 'TENVO marketing site and application availability.',
};

export default function StatusPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">System status</h1>
          <p className="mt-2 text-sm text-neutral-500">Snapshot: {updated}</p>
          <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
            <p className="text-sm font-black uppercase tracking-wider text-emerald-800">All systems operational</p>
            <p className="mt-2 text-sm font-medium text-emerald-900/90">
              The TENVO marketing site and core application regions we operate are available. If you experience an
              outage, email{' '}
              <a className="font-bold underline underline-offset-2" href="mailto:tenvo@mindscapeanalytics.com">
                tenvo@mindscapeanalytics.com
              </a>{' '}
              with timestamps and your business domain.
            </p>
          </div>
          <p className="mt-8 text-sm text-neutral-600">
            For enterprise status pages or webhooks, ask your account lead on{' '}
            <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              contact
            </Link>
            .
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
