/**
 * Registration wizard step gating smoke test.
 * Run: node scripts/verify-registration-wizard.mjs
 */
import {
  getMaxAccessibleRegistrationStep,
  canAccessRegistrationStep,
  clampRegistrationStep,
  resolveInitialRegistrationStep,
  registrationWantsExplicitResume,
} from '../lib/registration/registrationWizard.js';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(getMaxAccessibleRegistrationStep({}) === 1, 'empty form -> step 1');
assert(
  getMaxAccessibleRegistrationStep({ businessName: 'Tyre', handle: 'tyre-shop' }) === 2,
  'name+handle -> step 2'
);
assert(
  getMaxAccessibleRegistrationStep({
    businessName: 'Tyre',
    handle: 'tyre-shop',
    category: 'tyre-shop',
  }) === 3,
  'full form -> step 3'
);

assert(!canAccessRegistrationStep(3, { businessName: 'A', handle: 'b' }), 'block step 3 without category');
assert(clampRegistrationStep(3, { businessName: 'A', handle: 'b' }) === 2, 'clamp step 3 to 2');

const params = new URLSearchParams('step=3');
assert(
  resolveInitialRegistrationStep({
    searchParams: params,
    savedData: { businessName: 'A', handle: 'b' },
  }) === 1,
  'step=3 without category resumes at 1'
);
assert(
  resolveInitialRegistrationStep({
    searchParams: params,
    savedData: { businessName: 'A', handle: 'b', category: 'retail-shop' },
  }) === 3,
  'step=3 with full data resumes at 3'
);

assert(registrationWantsExplicitResume(new URLSearchParams('new=1')) === false, 'new=1 is not explicit resume');
assert(registrationWantsExplicitResume(new URLSearchParams('verified=true')) === true, 'verified is explicit resume');

if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exit(1);
}

console.log('OK: registration wizard step gating');
