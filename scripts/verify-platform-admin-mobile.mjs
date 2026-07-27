/**
 * Smoke: Platform Admin mobile dual-layout wiring.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let failed = 0;
const ok = (msg) => console.log(`OK: ${msg}`);
const mark = (msg) => {
  failed += 1;
  console.error(`FAIL: ${msg}`);
};
const includes = (rel, needle, label) => {
  if (read(rel).includes(needle)) ok(label);
  else mark(label);
};

includes('components/admin/AdminMobileNav.jsx', "variant === 'tiles'", 'AdminMobileNav has tiles variant');
includes('components/admin/AdminMobileNav.jsx', "variant === 'dock'", 'AdminMobileNav has dock variant');
includes('components/admin/AdminMobileNav.jsx', 'MobileHubTile', 'AdminMobileNav uses MobileHubTile');
includes('components/admin/PlatformAdminPanel.jsx', 'AdminMobileNav', 'PlatformAdminPanel wires AdminMobileNav');
includes('components/admin/PlatformAdminPanel.jsx', 'mobileMenuOpen', 'PlatformAdminPanel has mobile menu state');
includes('components/admin/PlatformAdminPanel.jsx', 'All sections', 'PlatformAdminPanel has back-to-sections bar');
includes('components/admin/PlatformAdminPanel.jsx', 'lg:hidden', 'PlatformAdminPanel dual-layout mobile');
includes('components/admin/PlatformAdminPanel.jsx', 'hidden lg:block', 'PlatformAdminPanel dual-layout desktop');
includes('components/admin/PlatformAdminPanel.jsx', 'formatPlatformMinorRevenue', 'Overview formats billing minor units');
includes('components/admin/PlatformAdminPanel.jsx', 'isBusinessTrialing', 'Trial badge uses accurate helper');
includes('components/admin/PlatformAdminPanel.jsx', 'aria-modal', 'Business detail modal is accessible');
includes('components/admin/PlatformAdminPanel.jsx', 'searchTimerRef', 'Business search is debounced');
includes('lib/actions/admin/platform.js', 'stripe_subscription_status', 'Business list includes Stripe status for trial badge');
includes('app/admin/page.jsx', 'safe-area-inset-bottom', 'Admin page has safe-area padding');

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll platform admin mobile checks passed.');
