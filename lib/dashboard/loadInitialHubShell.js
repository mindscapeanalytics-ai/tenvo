/**
 * Server-side hub Overview bootstrap for cold login paint.
 * Matches FilterProvider default range (30d) so client soft-revalidate keys align.
 */
import { getServerSession } from '@/lib/auth/rbac';
import { getBusinessByDomainAndUser } from '@/lib/actions/basic/business';
import { getHubShellBootstrapAction } from '@/lib/actions/dashboard/hubShellBootstrap';
import { getDefaultDateRange } from '@/lib/utils/datePresets';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

/**
 * @param {string} category - Hub domain segment from `/business/[category]`
 * @returns {Promise<{
 *   businessId: string,
 *   dateFrom: string,
 *   dateTo: string,
 *   payload: Record<string, unknown>,
 * } | null>}
 */
export async function loadInitialHubShell(category) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    const domain = String(category || '')
      .trim()
      .toLowerCase();
    if (!userId || !domain) return null;

    const bizRes = await getBusinessByDomainAndUser(domain, userId);
    const business = bizRes?.success ? bizRes.business : null;
    const businessId = business?.id;
    if (!businessId) return null;

    const range = getDefaultDateRange();
    const dateFrom = toAnalyticsIsoDate(range.from);
    const dateTo = toAnalyticsIsoDate(range.to);
    if (!dateFrom || !dateTo) return null;

    const shell = await getHubShellBootstrapAction(businessId, {
      from: dateFrom,
      to: dateTo,
    });
    if (!shell?.success || (!shell.kpis && !shell.finance)) return null;

    const payload = {
      kpis: shell.kpis,
      finance: shell.finance,
      glSummary: shell.glSummary,
      chartSeries: shell.chartSeries,
      expenseBreakdown: shell.expenseBreakdown,
      activity: shell.activity,
      invoices: shell.invoices,
      customers: shell.customers,
      products: shell.products,
      productTotal: shell.productTotal,
      hasMoreProducts: shell.hasMoreProducts,
      locations: shell.locations,
      range: shell.range || { from: dateFrom, to: dateTo },
      meta: shell.meta,
      ...(shell.errors && typeof shell.errors === 'object' ? { errors: shell.errors } : {}),
    };

    return /** @type {{ businessId: string, dateFrom: string, dateTo: string, payload: Record<string, unknown> }} */ (
      serializeDecimalsDeep({
        businessId,
        dateFrom,
        dateTo,
        payload,
      })
    );
  } catch (error) {
    console.error('[loadInitialHubShell] failed:', error);
    return null;
  }
}
