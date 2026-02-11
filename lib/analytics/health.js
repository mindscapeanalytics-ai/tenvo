/**
 * Business Health Score Utility
 * Calculates a score from 0-100 based on financial performance metrics
 */

export function calculateBusinessHealth(data) {
    const {
        revenue = 0,
        grossProfit = 0,
        inventoryValue = 0,
        accountsReceivable = 0,
        lowStockCount = 0,
        totalProducts = 0,
        pendingInvoices = 0
    } = data;

    let score = 70; // Base score

    // 1. Profitability (Weight: 30%)
    const margin = revenue > 0 ? (grossProfit / revenue) : 0;
    if (margin > 0.4) score += 15;
    else if (margin > 0.2) score += 10;
    else if (margin > 0.1) score += 5;
    else if (margin < 0.05 && revenue > 0) score -= 10;

    // 2. Inventory Efficiency (Weight: 25%)
    const stockHealth = totalProducts > 0 ? (totalProducts - lowStockCount) / totalProducts : 1;
    if (stockHealth > 0.95) score += 10;
    else if (stockHealth < 0.7) score -= 15;

    // 3. Flow & Reliability (Weight: 25%)
    if (accountsReceivable > revenue * 0.5 && revenue > 0) score -= 15;
    if (pendingInvoices > 10) score -= 5;

    // 4. Activity Multiplier
    if (revenue > 1000000) score += 5;

    return Math.min(100, Math.max(0, Math.round(score)));
}

export function getHealthStatus(score) {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Business is thriving with optimal efficiency.' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', description: 'Strong performance with minor optimization room.' };
    if (score >= 50) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50', description: 'Steady but watch your cash flow closely.' };
    return { label: 'At Risk', color: 'text-rose-600', bg: 'bg-rose-50', description: 'Immediate operational audit recommended.' };
}
