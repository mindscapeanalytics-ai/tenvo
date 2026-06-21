import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MarketingPageHeader, MarketingSection } from '@/components/marketing/layout/MarketingSection';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

export const metadata = {
  title: 'Careers',
  description: 'Build TENVO and enterprise automation with Mindscape Analytics LLC.',
};

export default function CareersPage() {
  return (
    <MarketingLayout>
      <MarketingPageHeader
        title="Careers"
        description={
          <>
            TENVO is built by {TENVO_PARENT_COMPANY.name}. We hire engineers, product designers, and solutions
            specialists who care about operators in Pakistan and emerging markets.
          </>
        }
      />
      <MarketingSection className="bg-neutral-50/50" padding="default" width="narrow">
        <ul className="list-disc space-y-4 pl-5 text-sm font-medium leading-relaxed text-neutral-700">
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
      </MarketingSection>
    </MarketingLayout>
  );
}
