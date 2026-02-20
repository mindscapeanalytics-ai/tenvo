import {
    submitApprovalAction,
    resolveApprovalAction,
    getPendingApprovalsAction,
    getApprovalHistoryAction
} from '@/lib/actions/standard/workflow';

export const workflowAPI = {
    async submit(data) { return await submitApprovalAction(data); },
    async resolve(data) { return await resolveApprovalAction(data); },
    async getPending(businessId) { return await getPendingApprovalsAction(businessId); },
    async getHistory(businessId, filters) { return await getApprovalHistoryAction(businessId, filters); },
};
