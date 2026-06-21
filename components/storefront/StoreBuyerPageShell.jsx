import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Compact mobile-first shell for buyer policy / support pages.
 */
export function StoreBuyerPageShell({
  businessDomain,
  title,
  subtitle,
  children,
  backHref,
}) {
  const home = backHref || `/store/${businessDomain}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
          <Link
            href={home}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to store
          </Link>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 sm:text-base">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-4 sm:py-8">{children}</div>
    </div>
  );
}
