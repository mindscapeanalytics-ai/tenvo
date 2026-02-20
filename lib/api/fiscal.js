import {
    createFiscalPeriodAction,
    getFiscalPeriodsAction,
    closeFiscalPeriodAction,
    reopenFiscalPeriodAction
} from '@/lib/actions/basic/fiscal';

export const fiscalAPI = {
    async createPeriod(businessId, data) {
        return await createFiscalPeriodAction(businessId, data);
    },
    async getPeriods(businessId) {
        return await getFiscalPeriodsAction(businessId);
    },
    async closePeriod(businessId, periodId) {
        return await closeFiscalPeriodAction(businessId, periodId);
    },
    async reopenPeriod(businessId, periodId) {
        return await reopenFiscalPeriodAction(businessId, periodId);
    },
};
