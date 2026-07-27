#!/usr/bin/env bun
/**
 * Smoke-check that production image delivery is not stuck on Vercel Image
 * Optimization 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
 *
 * Usage:
 *   bun scripts/verify-vercel-image-delivery.mjs
 *   bun scripts/verify-vercel-image-delivery.mjs https://www.tenvo.store
 */
const base = String(process.argv[2] || 'https://www.tenvo.store').replace(/\/$/, '');
const localWebp = '/tenvo-img/webp/tenvo-dashboard.webp';
const optimized = `/_next/image?url=${encodeURIComponent(localWebp)}&w=640&q=75`;

async function head(path) {
  const res = await fetch(`${base}${path}`, { method: 'HEAD', redirect: 'follow' });
  return {
    path,
    status: res.status,
    vercelError: res.headers.get('x-vercel-error') || '',
    contentType: res.headers.get('content-type') || '',
  };
}

const [staticHit, optHit] = await Promise.all([head(localWebp), head(optimized)]);

const lines = [
  `Base: ${base}`,
  `Static ${staticHit.path} → ${staticHit.status} ${staticHit.contentType}`,
  `Optimized ${optHit.path} → ${optHit.status}${optHit.vercelError ? ` (${optHit.vercelError})` : ''}`,
];

let failed = false;
if (staticHit.status !== 200) {
  failed = true;
  lines.push('FAIL: marketing WebP must be publicly reachable from /public.');
}

if (optHit.vercelError === 'OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED' || optHit.status === 402) {
  // Acceptable only when the deploy serves unoptimized next/image (src = original URL).
  // Probe homepage HTML for /_next/image usage as primary img src pattern.
  const html = await fetch(`${base}/`).then((r) => r.text());
  const usesOptimizedSrc = /src="[^"]*\/_next\/image\?/i.test(html)
    || /srcSet="[^"]*\/_next\/image\?/i.test(html);
  if (usesOptimizedSrc) {
    failed = true;
    lines.push(
      'FAIL: Vercel Image Optimization is unpaid (402) but HTML still references /_next/image. ' +
        'Set images.unoptimized on Vercel (default) or enable the add-on + NEXT_IMAGE_OPTIMIZATION=1.'
    );
  } else {
    lines.push(
      'OK: optimizer is unpaid, but pages are not depending on /_next/image srcs (unoptimized mode).'
    );
  }
} else if (optHit.status >= 400) {
  failed = true;
  lines.push(`FAIL: unexpected optimizer status ${optHit.status}.`);
} else {
  lines.push('OK: Image Optimization responds successfully.');
}

console.log(lines.join('\n'));
process.exit(failed ? 1 : 0);
