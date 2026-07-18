#!/usr/bin/env bun
/**
 * Static wiring checks: hub tabs pass a resolved tenant id, not raw `business?.id` fans-out.
 * Run: bun scripts/verify-hub-business-id.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

let failed = 0;
function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed += 1;
}
function ok(msg) {
  console.log(`OK: ${msg}`);
}

const tabs = read('app/business/[category]/components/DashboardTabs.jsx');
if (!tabs.includes('useResolvedBusinessId')) {
  fail('DashboardTabs must use useResolvedBusinessId');
} else {
  ok('DashboardTabs imports useResolvedBusinessId');
}
if (!tabs.includes('activeBusinessId')) {
  fail('DashboardTabs must define activeBusinessId');
} else {
  ok('DashboardTabs defines activeBusinessId');
}
if (tabs.includes('businessId={business?.id}')) {
  fail('DashboardTabs still passes businessId={business?.id} — use activeBusinessId');
} else {
  ok('DashboardTabs does not fan out business?.id as businessId');
}

const chat = read('app/business/[category]/components/islands/portlets/AgenticAnalystChat.client.tsx');
if (chat.includes('businessIdProp && businessIdProp !== businessId')) {
  fail('AgenticAnalystChat must not unmount on prop/context id mismatch');
} else {
  ok('AgenticAnalystChat does not conflict-unmount on hydrate');
}
if (!chat.includes('useResolvedBusinessId')) {
  fail('AgenticAnalystChat must resolve businessId via hook');
} else {
  ok('AgenticAnalystChat uses useResolvedBusinessId');
}

const visual = read('app/business/[category]/components/islands/VisualAnalyticsPanel.client.tsx');
if (!visual.includes('useResolvedBusinessId')) {
  fail('VisualAnalyticsPanel must use useResolvedBusinessId');
} else {
  ok('VisualAnalyticsPanel resolves tenant id');
}
if (!visual.includes('!resolvedBusinessId')) {
  fail('VisualAnalyticsPanel must wait on resolvedBusinessId before empty state');
} else {
  ok('VisualAnalyticsPanel waits for tenant before empty charts');
}

const hook = read('lib/hooks/useResolvedBusinessId.ts');
if (!hook.includes('normalizeBusinessId') || !hook.includes('useResolvedBusinessId')) {
  fail('useResolvedBusinessId hook incomplete');
} else {
  ok('useResolvedBusinessId exports normalize + hook');
}

const finance = read('components/finance/FinanceHub.jsx');
if (!finance.includes('useResolvedBusinessId(businessId)')) {
  fail('FinanceHub must resolve businessId via hook');
} else {
  ok('FinanceHub resolves effectiveBusinessId via hook');
}

const analyticsAction = read('lib/actions/premium/ai/analytics.js');
if (!analyticsAction.includes("Business ID is required")) {
  fail('getAnalyticsBundleAction must guard missing businessId');
} else {
  ok('getAnalyticsBundleAction guards missing businessId');
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nHub businessId wiring checks passed');
