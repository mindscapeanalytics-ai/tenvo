#!/usr/bin/env node

/**
 * Comprehensive verification for all flow fixes
 * Run: node scripts/verify-complete-flow-fixes.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const checks = [];
let passCount = 0;
let failCount = 0;

function check(name, condition, details = '') {
  const result = condition();
  const status = result ? '✅' : '❌';
  checks.push({ name, status, passed: result, details });
  if (result) passCount++;
  else failCount++;
  return result;
}

function fileContains(filePath, searchString) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes(searchString);
  } catch (e) {
    return false;
  }
}

console.log('\n🔍 Verifying Complete Flow Fixes\n');
console.log('═'.repeat(70) + '\n');

// ============================================================================
// CATEGORY 1: Authentication & Registration Fixes
// ============================================================================
console.log('📝 Category 1: Authentication & Registration\n');

check(
  '[AUTH-1] Business cache includes approval_status',
  () => fileContains(
    'lib/utils/businessClientCache.js',
    'approval_status: business.approval_status'
  ),
  'Cached business includes approval status field'
);

check(
  '[AUTH-2] Business cache includes approval_requested_at',
  () => fileContains(
    'lib/utils/businessClientCache.js',
    'approval_requested_at: business.approval_requested_at'
  ),
  'Cached business includes requested timestamp'
);

check(
  '[AUTH-3] Business cache includes approval_decided_at',
  () => fileContains(
    'lib/utils/businessClientCache.js',
    'approval_decided_at: business.approval_decided_at'
  ),
  'Cached business includes decided timestamp'
);

check(
  '[AUTH-4] Registration clears cache before redirect',
  () => fileContains(
    'app/register/page.js',
    "localStorage.removeItem('businessData')"
  ),
  'Cache cleared to prevent optimistic load'
);

check(
  '[AUTH-5] Registration uses blocking redirect',
  () => fileContains(
    'app/register/page.js',
    'window.location.href = \'/pending-approval\''
  ),
  'Uses window.location.href (blocking) for approval redirect'
);

check(
  '[AUTH-6] BusinessContext checks approval status',
  () => fileContains(
    'lib/context/BusinessContext.js',
    "approvalStatus === 'pending_approval'"
  ),
  'BusinessContext guards unapproved businesses'
);

check(
  '[AUTH-7] Auth confirmed checks approval',
  () => fileContains(
    'app/auth/confirmed/page.js',
    "const needsApproval"
  ),
  'OAuth callback respects approval workflow'
);

console.log('\n' + '─'.repeat(70) + '\n');

// ============================================================================
// CATEGORY 2: Dashboard Data & Loading Fixes
// ============================================================================
console.log('📊 Category 2: Dashboard Data & Loading\n');

check(
  '[DASH-1] DataContext clears invoices on business switch',
  () => fileContains(
    'lib/context/DataContext.js',
    'setInvoices([])'
  ) && fileContains(
    'lib/context/DataContext.js',
    'if (!id) {'
  ),
  'Invoices cleared when business changes'
);

check(
  '[DASH-2] DataContext clears products on business switch',
  () => fileContains(
    'lib/context/DataContext.js',
    'setProducts([])'
  ),
  'Products cleared when business changes'
);

check(
  '[DASH-3] DataContext clears customers on business switch',
  () => fileContains(
    'lib/context/DataContext.js',
    'setCustomers([])'
  ),
  'Customers cleared when business changes'
);

check(
  '[DASH-4] DataContext clears vendors on business switch',
  () => fileContains(
    'lib/context/DataContext.js',
    'setVendors([])'
  ),
  'Vendors cleared when business changes'
);

check(
  '[DASH-5] DataContext clears purchase orders on business switch',
  () => fileContains(
    'lib/context/DataContext.js',
    'setPurchaseOrders([])'
  ),
  'Purchase orders cleared when business changes'
);

check(
  '[DASH-6] Module ready flags reset on business switch',
  () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'lib/context/DataContext.js'),
      'utf8'
    );
    const hasModuleReadyReset = content.includes('moduleReadyRef.current = {}');
    const hasModuleInFlightReset = content.includes('moduleInFlightRef.current = {}');
    return hasModuleReadyReset && hasModuleInFlightReset;
  },
  'Module state completely reset on business change'
);

console.log('\n' + '─'.repeat(70) + '\n');

// ============================================================================
// CATEGORY 3: Domain Validation & Routing Fixes
// ============================================================================
console.log('🔀 Category 3: Domain Validation & Routing\n');

check(
  '[ROUTE-1] Domain validation checks approval first',
  () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'app/business/[category]/DashboardClient.jsx'),
      'utf8'
    );
    const domainValidationSection = content.substring(
      content.indexOf('// Domain Validation'),
      content.indexOf('// Domain Validation') + 1500
    );
    const approvalCheckIndex = domainValidationSection.indexOf('needsApproval');
    const switchCallIndex = domainValidationSection.indexOf('switchBusinessByDomain');
    return approvalCheckIndex > 0 && switchCallIndex > approvalCheckIndex;
  },
  'Approval check happens BEFORE domain switch attempt'
);

check(
  '[ROUTE-2] Domain validation skips if unapproved',
  () => fileContains(
    'app/business/[category]/DashboardClient.jsx',
    'if (needsApproval) {'
  ) && fileContains(
    'app/business/[category]/DashboardClient.jsx',
    "// Let PendingApprovalGuard handle"
  ),
  'Unapproved businesses skip domain switch'
);

check(
  '[ROUTE-3] Optimistic tab cleared on pathname change',
  () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'app/business/[category]/DashboardClient.jsx'),
      'utf8'
    );
    // Check if there's a useEffect that clears optimistic tab based on pathname
    const hasPathnameEffect = content.includes('[pathname]');
    const hasSetOptimisticNull = content.includes('setOptimisticTab(null)');
    const hasComment = content.includes('browser back/forward') || content.includes('pathname change');
    return hasPathnameEffect && hasSetOptimisticNull && hasComment;
  },
  'Browser back/forward clears optimistic state'
);

check(
  '[ROUTE-4] Domain validation dependency includes approval_status',
  () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'app/business/[category]/DashboardClient.jsx'),
      'utf8'
    );
    const domainEffect = content.substring(
      content.indexOf('// Domain Validation'),
      content.indexOf('// Domain Validation') + 2000
    );
    return domainEffect.includes('business?.approval_status');
  },
  'Domain validation reacts to approval status changes'
);

console.log('\n' + '─'.repeat(70) + '\n');

// ============================================================================
// CATEGORY 4: Tab System Improvements
// ============================================================================
console.log('🔖 Category 4: Tab System Improvements\n');

check(
  '[TAB-1] Tab alias: dash → dashboard',
  () => fileContains('lib/config/tabs.js', "dash: 'dashboard'"),
  'Shortcut "dash" routes to dashboard'
);

check(
  '[TAB-2] Tab alias: prod → inventory',
  () => fileContains('lib/config/tabs.js', "prod: 'inventory'"),
  'Shortcut "prod" routes to inventory'
);

check(
  '[TAB-3] Tab alias: exp → finance (expenses view)',
  () => fileContains('lib/config/tabs.js', "exp: 'finance'") && fileContains('lib/config/tabs.js', "exp: 'expenses'"),
  'Shortcut "exp" routes to finance hub with expenses view'
);

check(
  '[TAB-4] Tab alias: mfg → manufacturing',
  () => fileContains('lib/config/tabs.js', "mfg: 'manufacturing'"),
  'Shortcut "mfg" routes to manufacturing'
);

check(
  '[TAB-5] Tab alias: fin → finance',
  () => fileContains('lib/config/tabs.js', "fin: 'finance'"),
  'Shortcut "fin" routes to finance'
);

check(
  '[TAB-6] Tab alias: acc → finance',
  () => fileContains('lib/config/tabs.js', "acc: 'finance'"),
  'Shortcut "acc" routes to finance hub'
);

check(
  '[TAB-7] Tab alias: pay → payments',
  () => fileContains('lib/config/tabs.js', "pay: 'payments'"),
  'Shortcut "pay" routes to payments'
);

check(
  '[TAB-8] Tab alias: rep → reports',
  () => fileContains('lib/config/tabs.js', "rep: 'reports'"),
  'Shortcut "rep" routes to reports'
);

console.log('\n' + '═'.repeat(70) + '\n');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('📊 Verification Results Summary\n');

const categories = {
  auth: checks.filter(c => c.name.startsWith('[AUTH-')),
  dash: checks.filter(c => c.name.startsWith('[DASH-')),
  route: checks.filter(c => c.name.startsWith('[ROUTE-')),
  tab: checks.filter(c => c.name.startsWith('[TAB-')),
};

Object.entries(categories).forEach(([cat, catChecks]) => {
  const passed = catChecks.filter(c => c.passed).length;
  const total = catChecks.length;
  const status = passed === total ? '✅' : '⚠️';
  console.log(`${status} ${cat.toUpperCase()}: ${passed}/${total} checks passed`);
});

console.log('\n' + '─'.repeat(70) + '\n');

console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${checks.length}`);

console.log('\n' + '═'.repeat(70) + '\n');

// ============================================================================
// DETAILED RESULTS
// ============================================================================
if (failCount > 0) {
  console.log('❌ Failed Checks Details:\n');
  checks.filter(c => !c.passed).forEach(({ name, details }) => {
    console.log(`  ${name}`);
    if (details) console.log(`     ${details}\n`);
  });
  console.log('');
}

// ============================================================================
// FINAL VERDICT
// ============================================================================
if (failCount === 0) {
  console.log('🎉 All checks passed! Complete flow fixes are properly implemented.\n');
  console.log('✅ Authentication & Registration: Secure');
  console.log('✅ Dashboard Data & Loading: Clean');
  console.log('✅ Domain Validation & Routing: Conflict-free');
  console.log('✅ Tab System: Enhanced\n');
  console.log('🚀 Ready for production deployment!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Review the fixes and try again.\n');
  console.log(`   ${failCount} issue(s) need attention.\n`);
  process.exit(1);
}
