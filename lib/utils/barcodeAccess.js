import { planHasFeatureWithPackaging } from '@/lib/subscription/effectivePlanAccess';
import { resolvePlanTier } from '@/lib/config/plans';

/**
 * Whether tenant may use camera / intelligent barcode scan surfaces.
 */
export function canUseBarcodeScan(business) {
  if (!business) return true;
  const planTier = resolvePlanTier(business.plan_tier || business.planTier || 'free');
  const settings = business.settings;
  const platformOverrides = business.platformFeatureOverrides || business.platform_feature_overrides;
  return planHasFeatureWithPackaging(
    planTier,
    'barcode_scanning',
    settings,
    platformOverrides
  );
}
