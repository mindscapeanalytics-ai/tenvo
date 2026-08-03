import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MarketingPageHeader, MarketingSection } from '@/components/marketing/layout/MarketingSection';

export const metadata = {
  title: 'System Status',
  description: 'TENVO marketing site and application availability.',
};

export default function StatusPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <MarketingLayout>
      <MarketingPageHeader title="System status">
        <p className="mt-2 text-sm text-neutral-500">Snapshot: {updated}</p>
      </MarketingPageHeader>
      <MarketingSection className="bg-neutral-50/50" padding="default" width="narrow">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6">
          <p className="text-sm font-black uppercase tracking-wider text-emerald-800">All systems operational</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-900/90">
            The TENVO marketing site and core application regions we operate are available. If you experience an
            outage, email{' '}
            <a className="font-bold underline underline-offset-2" href="mailto:tenvo@mindscapeanalytics.com">
              tenvo@mindscapeanalytics.com
            </a>{' '}
            with timestamps and your business domain.
          </p>
        </div>
        <p className="mt-6 text-sm text-neutral-600 sm:mt-8">
          For enterprise status pages or webhooks, ask your account lead on{' '}
          <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
            contact
          </Link>
          .
        </p>
      </MarketingSection>
    </MarketingLayout>
  );
}
