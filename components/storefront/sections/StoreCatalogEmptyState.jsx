import Link from 'next/link';
import { Package } from 'lucide-react';

export function StoreCatalogEmptyState({
  businessDomain,
  accent,
  accentLight,
  title,
  body,
  storeName,
  contact = {},
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <div
        className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
        style={{ backgroundColor: accentLight }}
      >
        <Package className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: accent }} />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">{title}</h2>
      <p className="text-sm text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">{body}</p>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link
          href={`/store/${businessDomain}/products`}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white sm:px-6 sm:py-3"
          style={{ backgroundColor: accent }}
        >
          Browse catalog
        </Link>
        {contact.phone || contact.whatsappUrl ? (
          <>
            {contact.phone ? (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white sm:px-6 sm:py-3"
                style={{ backgroundColor: accent }}
              >
                Call {storeName}
              </a>
            ) : null}
            <Link
              href={`/store/${businessDomain}/contact`}
              className="text-sm font-semibold hover:underline"
              style={{ color: accent }}
            >
              Contact us
            </Link>
          </>
        ) : (
          <Link
            href={`/store/${businessDomain}/contact`}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white sm:px-6 sm:py-3"
            style={{ backgroundColor: accent }}
          >
            Contact {storeName}
          </Link>
        )}
      </div>
    </section>
  );
}
