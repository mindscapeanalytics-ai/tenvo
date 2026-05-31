import {
  getOrganizationSchema,
  getSoftwareApplicationSchema,
} from '@/lib/marketing/structured-data';

/** Global JSON-LD for Organization + SoftwareApplication (safe defaults). */
export function DefaultJsonLd() {
  const org = getOrganizationSchema();
  const app = getSoftwareApplicationSchema();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }}
      />
    </>
  );
}
