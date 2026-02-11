/**
 * Status Utility Functions
 * Centralized helpers for status colors, badges, and display
 */

export type StatusType = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft' | 'completed' | 'in_transit' | 'active' | 'inactive';

/**
 * Get Tailwind CSS classes for status badges
 */
export function getStatusColor(status: string | null | undefined): string {
    const normalizedStatus = (status || 'pending').toLowerCase();

    switch (normalizedStatus) {
        case 'paid':
        case 'completed':
        case 'active':
            return 'bg-green-100 text-green-700 border-green-200';

        case 'pending':
        case 'in_transit':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';

        case 'overdue':
        case 'cancelled':
            return 'bg-red-100 text-red-700 border-red-200';

        case 'draft':
        case 'inactive':
            return 'bg-gray-100 text-gray-700 border-gray-200';

        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

/**
 * Get status color for emerald/amber/rose palette (modern design)
 */
export function getStatusColorModern(status: string | null | undefined): string {
    const normalizedStatus = (status || 'pending').toLowerCase();

    switch (normalizedStatus) {
        case 'paid':
        case 'completed':
        case 'active':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';

        case 'pending':
        case 'in_transit':
            return 'bg-amber-50 text-amber-700 border-amber-100';

        case 'overdue':
        case 'cancelled':
            return 'bg-rose-50 text-rose-700 border-rose-100';

        case 'draft':
        case 'inactive':
            return 'bg-slate-50 text-slate-700 border-slate-100';

        default:
            return 'bg-slate-50 text-slate-700 border-slate-100';
    }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string | null | undefined): string {
    const normalizedStatus = (status || 'pending').toLowerCase();

    const labels: Record<string, string> = {
        'paid': 'Paid',
        'pending': 'Pending',
        'overdue': 'Overdue',
        'cancelled': 'Cancelled',
        'draft': 'Draft',
        'completed': 'Completed',
        'in_transit': 'In Transit',
        'active': 'Active',
        'inactive': 'Inactive',
    };

    return labels[normalizedStatus] || status || 'Unknown';
}

/**
 * Check if status is considered "positive" (completed, paid, active)
 */
export function isPositiveStatus(status: string | null | undefined): boolean {
    const normalizedStatus = (status || '').toLowerCase();
    return ['paid', 'completed', 'active'].includes(normalizedStatus);
}

/**
 * Check if status is considered "warning" (pending, in_transit)
 */
export function isWarningStatus(status: string | null | undefined): boolean {
    const normalizedStatus = (status || '').toLowerCase();
    return ['pending', 'in_transit'].includes(normalizedStatus);
}

/**
 * Check if status is considered "negative" (overdue, cancelled, inactive)
 */
export function isNegativeStatus(status: string | null | undefined): boolean {
    const normalizedStatus = (status || '').toLowerCase();
    return ['overdue', 'cancelled', 'inactive'].includes(normalizedStatus);
}
