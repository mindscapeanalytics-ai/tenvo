'use server';

import { PakistaniTaxService } from '@/lib/services/PakistaniTaxService';
import { withGuard } from '@/lib/rbac/serverGuard';

async function checkAuth(businessId, permission = 'tax.view') {
    const { session } = await withGuard(businessId, { permission });
    return session;
}

export async function getTaxConfigAction(businessId) {
    try {
        await checkAuth(businessId, 'tax.view');
        const config = await PakistaniTaxService.getTaxConfig(businessId);
        return { success: true, config };
    } catch (error) {
        console.error('Get tax config action error:', error);
        return { success: false, error: error.message };
    }
}

export async function configureTaxAction(taxData) {
    try {
        await checkAuth(taxData.businessId, 'tax.configure');
        const config = await PakistaniTaxService.configureTax(taxData);
        return { success: true, config };
    } catch (error) {
        console.error('Configure tax action error:', error);
        return { success: false, error: error.message };
    }
}
