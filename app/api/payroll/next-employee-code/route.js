import { NextResponse } from 'next/server';
import { getNextEmployeeCodeAction } from '@/lib/actions/standard/payroll';
import { pickBusinessIdFromSearchParams } from '@/lib/utils/pickBusinessId';
import { withGuard } from '@/lib/rbac/serverGuard';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = pickBusinessIdFromSearchParams(searchParams);

        if (!businessId) {
            return NextResponse.json(
                { error: 'Business ID is required' },
                { status: 400 }
            );
        }

        await withGuard(businessId, { permission: 'hr.view_employees', feature: 'payroll' });

        const result = await getNextEmployeeCodeAction(businessId);
        
        if (result.success) {
            return NextResponse.json({ code: result.code });
        } else {
            return NextResponse.json(
                { error: result.error || 'Failed to generate code' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Next employee code API error:', error);
        const status = error?.code === 'UNAUTHENTICATED' ? 401
            : error?.code === 'PERMISSION_DENIED' || error?.code === 'BUSINESS_ACCESS_DENIED' ? 403
                : 500;
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status }
        );
    }
}
