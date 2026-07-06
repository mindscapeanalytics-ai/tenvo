#!/usr/bin/env node

/**
 * Verification script for auth redirect and registration fixes
 * Run: node scripts/verify-auth-redirect-fixes.mjs
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

function fileExists(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    return fs.existsSync(fullPath);
  } catch (e) {
    return false;
  }
}

console.log('\n🔍 Verifying Auth Redirect & Registration Fixes\n');

// Check 1: Business cache includes approval fields
check(
  'Business cache includes approval status',
  () => fileContains(
    'lib/utils/businessClientCache.js',
    'approval_status: business.approval_status'
  ),
  'Ensures cached business includes approval_status field'
);

check(
  'Business cache includes approval_requested_at',
  () => fileContains(
    'lib/utils/businessClientCache.js',
    'approval_requested_at: business.approval_requested_at'
  ),
  'Ensures cached business includes approval_requested_at field'
);

check(
  'Business cache includes approval_decided_at',
  () => fileContains(
    'lib/utils/businessClientCache.js',
    'approval_decided_at: business.approval_decided_at'
  ),
  'Ensures cached business includes approval_decided_at field'
);

// Check 2: Registration page has proper approval redirect
check(
  'Registration clears cache before redirect',
  () => fileContains(
    'app/register/page.js',
    "localStorage.removeItem('businessData')"
  ),
  'Ensures cache is cleared to prevent optimistic load'
);

check(
  'Registration uses blocking redirect',
  () => fileContains(
    'app/register/page.js',
    'window.location.href = \'/pending-approval\''
  ),
  'Uses window.location.href (blocking) instead of router.push'
);

check(
  'Approval check happens BEFORE setup',
  () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'app/register/page.js'),
      'utf8'
    );
    // Find the completeProvisioning function
    const funcStart = content.indexOf('const completeProvisioning = async');
    if (funcStart === -1) return false;
    
    const funcContent = content.substring(funcStart, funcStart + 5000);
    const requiresApprovalIndex = funcContent.indexOf('bizResult.requiresApproval');
    const setupActionIndex = funcContent.indexOf('completeRegistrationSetupAction');
    const returnAfterApproval = funcContent.indexOf('return;', requiresApprovalIndex);
    
    // Setup should come after the return statement following approval check
    return requiresApprovalIndex > 0 && 
           setupActionIndex > 0 && 
           returnAfterApproval > 0 &&
           setupActionIndex > returnAfterApproval;
  },
  'Approval check runs with early return, setup only for auto-approved'
);

// Check 3: BusinessContext has approval guard
check(
  'BusinessContext checks approval status',
  () => fileContains(
    'lib/context/BusinessContext.js',
    "approvalStatus === 'pending_approval'"
  ),
  'Checks for pending_approval status'
);

check(
  'BusinessContext redirects unapproved businesses',
  () => fileContains(
    'lib/context/BusinessContext.js',
    "window.location.href = '/pending-approval'"
  ),
  'Uses blocking redirect for unapproved businesses'
);

check(
  'BusinessContext clears cache on redirect',
  () => fileContains(
    'lib/context/BusinessContext.js',
    'clearBusinessShell()'
  ),
  'Clears business shell before redirecting'
);

// Check 4: Auth confirmed has approval check
check(
  'Auth confirmed checks approval status',
  () => fileContains(
    'app/auth/confirmed/page.js',
    "approvalStatus === 'pending_approval'"
  ),
  'OAuth callback respects approval status'
);

check(
  'Auth confirmed routes to pending-approval',
  () => fileContains(
    'app/auth/confirmed/page.js',
    "router.push('/pending-approval')"
  ),
  'Redirects unapproved OAuth users to approval page'
);

// Check 5: PendingApprovalGuard exists
check(
  'PendingApprovalGuard component exists',
  () => fileExists('components/guards/PendingApprovalGuard.jsx'),
  'Layout-level guard exists'
);

check(
  'PendingApprovalGuard checks blocked statuses',
  () => fileContains(
    'components/guards/PendingApprovalGuard.jsx',
    "BLOCKED_APPROVAL_STATUSES"
  ),
  'Guard has list of blocked approval statuses'
);

check(
  'Business layout uses PendingApprovalGuard',
  () => fileContains(
    'app/business/layout.js',
    '<PendingApprovalGuard>'
  ),
  'Layout wraps children with approval guard'
);

// Check 6: Documentation exists
check(
  'Audit documentation exists',
  () => fileExists('docs/AUTH_REDIRECT_REGISTRATION_AUDIT.md'),
  'Comprehensive audit document created'
);

check(
  'Implementation summary exists',
  () => fileExists('docs/AUTH_REDIRECT_FIXES_IMPLEMENTED.md'),
  'Implementation summary document created'
);

// Print results
console.log('\n📊 Verification Results:\n');
checks.forEach(({ name, status, details }) => {
  console.log(`${status} ${name}`);
  if (details) {
    console.log(`   ${details}\n`);
  }
});

console.log(`\n✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${checks.length}\n`);

// Summary
if (failCount === 0) {
  console.log('🎉 All checks passed! Auth redirect fixes are properly implemented.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Review the fixes and try again.\n');
  process.exit(1);
}
