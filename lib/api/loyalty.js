import {
    createLoyaltyProgramAction,
    getLoyaltyProgramsAction,
    earnLoyaltyPointsAction,
    redeemLoyaltyPointsAction,
    getLoyaltyBalanceAction
} from '@/lib/actions/standard/loyalty';

export const loyaltyAPI = {
    async createProgram(data) { return await createLoyaltyProgramAction(data); },
    async getPrograms(businessId) { return await getLoyaltyProgramsAction(businessId); },
    async earnPoints(data) { return await earnLoyaltyPointsAction(data); },
    async redeemPoints(data) { return await redeemLoyaltyPointsAction(data); },
    async getBalance(businessId, customerId, programId) {
        return await getLoyaltyBalanceAction(businessId, customerId, programId);
    },
};
