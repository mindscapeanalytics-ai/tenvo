/**
 * Merge `settings.packaging` into `businesses.settings` (modular feature overrides).
 * Used by platform admin and business owner flows — keep behavior identical.
 *
 * @param {unknown} prevSettings - existing `businesses.settings` JSON
 * @param {{ mode?: 'tier' | 'custom', featureOverrides?: Record<string, boolean> | null | undefined }} params
 * @returns {{ nextSettings: Record<string, unknown>, packaging: { mode: string, feature_overrides?: Record<string, boolean> } }}
 */
export function mergePackagingIntoBusinessSettings(
  prevSettings,
  { mode = 'tier', featureOverrides = undefined } = {}
) {
  const prev =
    prevSettings && typeof prevSettings === 'object' && !Array.isArray(prevSettings)
      ? { ...prevSettings }
      : {};

  const normalizedMode = mode === 'custom' ? 'custom' : 'tier';

  const packaging =
    normalizedMode === 'custom' &&
    featureOverrides &&
    typeof featureOverrides === 'object' &&
    !Array.isArray(featureOverrides)
      ? { mode: 'custom', feature_overrides: { ...featureOverrides } }
      : { mode: 'tier' };

  return { nextSettings: { ...prev, packaging }, packaging };
}
