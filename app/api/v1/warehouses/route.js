export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { WarehouseService } from '@/lib/services/WarehouseService';
import { withGuard } from '@/lib/rbac/serverGuard';

/**
 * GET /api/v1/warehouses?businessId=xxx
 * List all warehouses for a business
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('businessId');
        if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

        await withGuard(businessId, { permission: 'warehouses.view' });

        const result = await WarehouseService.getWarehouses(businessId);
        return NextResponse.json({ success: true, warehouses: result });
    } catch (error) {
        console.error('GET /api/v1/warehouses error:', error);
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 403 : 500 });
    }
}

/**
 * POST /api/v1/warehouses
 * Create a new warehouse
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { business_id: businessId, ...warehouseData } = body;
        if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

        const { session } = await withGuard(businessId, { permission: 'warehouses.manage' });

        const warehouse = await WarehouseService.createWarehouse({ ...warehouseData, business_id: businessId });
        return NextResponse.json({ success: true, warehouse }, { status: 201 });
    } catch (error) {
        console.error('POST /api/v1/warehouses error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

