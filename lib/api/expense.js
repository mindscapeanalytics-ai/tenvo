import {
    createExpenseAction,
    getExpensesAction,
    getExpenseSummaryAction,
    deleteExpenseAction
} from '@/lib/actions/basic/expense';

export const expenseAPI = {
    async create(data) {
        return await createExpenseAction(data);
    },
    async getAll(businessId, filters) {
        return await getExpensesAction(businessId, filters);
    },
    async getSummary(businessId, startDate, endDate) {
        return await getExpenseSummaryAction(businessId, startDate, endDate);
    },
    async delete(businessId, expenseId) {
        return await deleteExpenseAction(businessId, expenseId);
    },
};
