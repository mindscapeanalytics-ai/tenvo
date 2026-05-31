import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

export const metadata = {
  title: 'Careers',
  description: 'Build TENVO and enterprise automation with Mindscape Analytics LLC.',
};

export default function CareersPage() {
  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Careers</h1>
          <p className="mt-6 text-sm font-medium leading-relaxed text-neutral-700">
            TENVO is built by {TENVO_PARENT_COMPANY.name}. We hire engineers, product designers, and solutions
            specialists who care about operators in Pakistan and emerging markets.
          </p>
          <ul className="mt-8 list-disc space-y-3 pl-5 text-sm font-medium text-neutral-700">
            <li>
              Open roles and partnerships: see{' '}
              <a
                href={TENVO_PARENT_COMPANY.website}
                className="font-bold text-brand-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mindscape Analytics
              </a>{' '}
              or write to{' '}
              <a className="font-bold text-brand-primary underline-offset-2 hover:underline" href="mailto:tenvo@mindscapeanalytics.com">
                tenvo@mindscapeanalytics.com
              </a>
              .
            </li>
            <li>
              Product and onboarding questions:{' '}
              <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                Contact TENVO
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </MarketingLayout>
  );
}
