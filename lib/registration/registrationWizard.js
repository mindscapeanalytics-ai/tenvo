/**
 * Registration wizard step gating — keep step order enforced for all 65+ verticals.
 */

/**
 * @param {Record<string, unknown> | null | undefined} formData
 * @returns {number} Highest step the user may view (1–3)
 */
export function getMaxAccessibleRegistrationStep(formData) {
  const businessName = String(formData?.businessName || '').trim();
  const handle = String(formData?.handle || '').trim();
  const category = String(formData?.category || '').trim();

  if (!businessName || !handle) return 1;
  if (!category) return 2;
  return 3;
}

/**
 * @param {number} step
 * @param {Record<string, unknown> | null | undefined} formData
 */
export function canAccessRegistrationStep(step, formData) {
  const target = Number(step);
  if (!Number.isFinite(target) || target < 1) return false;
  return target <= getMaxAccessibleRegistrationStep(formData);
}

/**
 * @param {number} step
 * @param {Record<string, unknown> | null | undefined} formData
 * @returns {number}
 */
export function clampRegistrationStep(step, formData) {
  const target = Number(step);
  if (!Number.isFinite(target) || target < 1) return 1;
  const max = getMaxAccessibleRegistrationStep(formData);
  return Math.min(Math.max(1, target), max);
}

/**
 * @param {URLSearchParams | null | undefined} params
 */
export function registrationWantsExplicitResume(params) {
  if (!params) return false;
  if (params.get('new') === '1') return false;
  if (params.get('verified') === 'true') return true;
  const stepParam = params.get('step');
  return stepParam === '2' || stepParam === '3';
}

/**
 * Resolve initial wizard step on the client.
 * @param {{
 *   searchParams?: URLSearchParams | null;
 *   savedStep?: number;
 *   savedData?: Record<string, unknown> | null;
 *   isRecentSave?: boolean;
 * }} options
 */
export function resolveInitialRegistrationStep({
  searchParams = null,
  savedStep = 1,
  savedData = null,
  isRecentSave = false,
} = {}) {
  if (searchParams?.get('new') === '1') {
    return 1;
  }

  if (registrationWantsExplicitResume(searchParams)) {
    const requested = searchParams?.get('verified') === 'true'
      ? 3
      : parseInt(String(searchParams?.get('step') || '1'), 10);
    if (requested >= 1 && requested <= 3 && canAccessRegistrationStep(requested, savedData)) {
      return requested;
    }
    return 1;
  }

  if (isRecentSave && savedStep > 1 && canAccessRegistrationStep(savedStep, savedData)) {
    return savedStep;
  }

  return 1;
}
