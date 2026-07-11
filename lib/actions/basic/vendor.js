'use server';

import { db } from '@/lib/db';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';
import { vendorSchema, validateWithSchema } from '@/lib/validation/schemas';
import { withGuard } from '@/lib/rbac/serverGuard';
import { checkPlanLimit } from '@/lib/auth/planGuard';
import { assertEntityBelongsToBusiness } from '@/lib/actions/_shared/tenant';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

async function checkAuth(businessId, permission = 'vendors.view') {
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Server Action: Get all vendors for a business
 * 
 * @param {string} businessId - Business UUID
 * @returns {Promise<{success: boolean, vendors?: any[], error?: string}>}
 */
export async function getVendorsAction(businessId) {
    try {
        await checkAuth(businessId, 'vendors.view');

        const vendors = await db.vendors.findMany({
            where: {
                business_id: businessId,
                is_deleted: false,
                is_active: true
            },
            orderBy: { name: 'asc' }
        });

        return { success: true, vendors: /** @type {unknown[]} */ (serializeDecimalsDeep(vendors)) };
    } catch (error) {
        console.error('getVendorsAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get vendor by ID
 */
export async function getVendorByIdAction(businessId, vendorId) {
    try {
        await checkAuth(businessId, 'vendors.view');

        const vendor = await db.vendors.findFirst({
            where: {
                id: vendorId,
                business_id: businessId,
                is_deleted: false
            }
        });

        if (!vendor) {
            return { success: false, error: 'Vendor not found or deleted' };
        }

        return { success: true, vendor: serializeDecimalsDeep(vendor) };
    } catch (error) {
        console.error('getVendorByIdAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create vendor
 */
export async function createVendorAction(vendorData) {
    try {
        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedData = { ...vendorData };

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        if (vendorData.creditLimit !== undefined) sanitizedData.credit_limit = parseFloat(vendorData.creditLimit) || 0;
        if (vendorData.openingBalance !== undefined) sanitizedData.opening_balance = parseFloat(vendorData.openingBalance) || 0;

        const validation = validateWithSchema(vendorSchema, sanitizedData);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errorCode: 'VALIDATION_ERROR',
                code: 'VALIDATION_ERROR',
                errors: validation.errors,
                details: validation.errors,
            };
        }
        const validated = validation.data;

        await checkAuth(validated.business_id, 'vendors.create');

        const currentVendorCount = await db.vendors.count({
            where: { business_id: validated.business_id, is_deleted: false }
        });
        await checkPlanLimit(validated.business_id, 'max_vendors', currentVendorCount + 1);

        const baseDomainData =
            validated.domain_data && typeof validated.domain_data === 'object' && !Array.isArray(validated.domain_data)
                ? { ...validated.domain_data }
                : {};
        // Persist UI-only extras that have no dedicated columns
        if (vendorData.market_location) baseDomainData.market_location = vendorData.market_location;
        if (vendorData.certificate_url) baseDomainData.certificate_url = vendorData.certificate_url;

        const vendor = await db.vendors.create({
            data: {
                business_id: validated.business_id,
                name: validated.name,
                email: validated.email || null,
                phone: validated.phone || null,
                contact_person: validated.contact_person || vendorData.contactPerson || null,
                ntn: validated.ntn || null,
                srn: validated.srn || vendorData.strn || null,
                address: validated.address || null,
                city: validated.city || null,
                state: validated.state || null,
                pincode: validated.pincode || null,
                country: validated.country || 'Pakistan',
                payment_terms: validated.payment_terms || null,
                notes: validated.notes || null,
                credit_limit: Number(validated.credit_limit || 0),
                outstanding_balance: Number(validated.outstanding_balance || 0),
                opening_balance: Number(validated.opening_balance || 0),
                filer_status: validated.filer_status || 'none',
                domain_data: baseDomainData,
                is_active: true,
                is_deleted: false,
            }
        });

        // Post opening balance GL entry if non-zero
        if (Number(vendor.opening_balance) !== 0) {
            try {
                await createGLEntryAction({
                    businessId: validated.business_id,
                    date: new Date().toISOString(),
                    description: `Opening Balance for Supplier: ${vendor.name}`,
                    referenceType: 'vendor_opening',
                    referenceId: vendor.id,
                    entries: [
                        { accountCode: ACCOUNT_CODES.SUSPENSE_ACCOUNT || '3000', debit: Math.abs(Number(vendor.opening_balance)), credit: 0 },
                        { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: Math.abs(Number(vendor.opening_balance)) }
                    ]
                });
            } catch (glError) {
                // Log but don't fail vendor creation for GL posting issues
                console.error('GL Entry for vendor opening balance failed:', glError);
            }
        }

        auditWrite({
            businessId: validated.business_id,
            action: 'create',
            entityType: 'vendor',
            entityId: vendor.id,
            description: `Created vendor: ${vendor.name}`,
            metadata: { openingBalance: vendor.opening_balance }
        });

        return { success: true, vendor: serializeDecimalsDeep(vendor) };
    } catch (error) {
        console.error('createVendorAction Error:', error);
        return {
            success: false,
            error: error.message,
            errorCode: error.code || null,
            requiredPlan: error.requiredPlan || null,
            limitKey: error.limitKey || null,
            limit: Number.isFinite(Number(error.limit)) ? Number(error.limit) : null,
        };
    }
}

/**
 * Server Action: Update vendor
 */
export async function updateVendorAction(businessId, vendorId, updates) {
    try {
        await checkAuth(businessId, 'vendors.edit');

        // Tenant isolation check (Prisma-native)
        await assertEntityBelongsToBusiness(null, 'vendor', vendorId, businessId);

        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedUpdates = { ...updates };

        numericFields.forEach(field => {
            if (sanitizedUpdates[field] !== undefined) {
                if (typeof sanitizedUpdates[field] === 'string') {
                    const val = parseFloat(sanitizedUpdates[field]);
                    sanitizedUpdates[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedUpdates[field] === null) {
                    sanitizedUpdates[field] = 0;
                }
            }
        });

        if (updates.creditLimit !== undefined) sanitizedUpdates.credit_limit = parseFloat(updates.creditLimit) || 0;
        if (updates.openingBalance !== undefined) sanitizedUpdates.opening_balance = parseFloat(updates.openingBalance) || 0;

        // Validate full object shape (merging in business_id for schema)
        const validation = validateWithSchema(vendorSchema, { ...sanitizedUpdates, business_id: businessId, id: vendorId });
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errorCode: 'VALIDATION_ERROR',
                code: 'VALIDATION_ERROR',
                errors: validation.errors,
                details: validation.errors,
            };
        }
        const validated = validation.data;

        // Whitelist allowed update fields
        const allowedFields = [
            'name', 'email', 'phone', 'contact_person', 'ntn', 'srn',
            'address', 'city', 'state', 'pincode', 'country', 'payment_terms', 'notes',
            'credit_limit', 'outstanding_balance', 'domain_data', 'filer_status',
            'opening_balance', 'is_active'
        ];

        const updateData = {};
        for (const [key, val] of Object.entries(validated)) {
            let dbKey = key;
            if (key === 'contactPerson') dbKey = 'contact_person';
            if (key === 'strn') dbKey = 'srn';
            if (key === 'tax_number') dbKey = 'ntn';
            if (key === 'tax_id') dbKey = 'ntn';

            if (allowedFields.includes(dbKey) && key !== 'id' && key !== 'business_id') {
                if (dbKey === 'domain_data') {
                    const merged =
                        (typeof val === 'object' && val !== null && !Array.isArray(val)) ? { ...val } : {};
                    if (updates.market_location) merged.market_location = updates.market_location;
                    if (updates.certificate_url) merged.certificate_url = updates.certificate_url;
                    updateData[dbKey] = merged;
                } else {
                    updateData[dbKey] = val;
                }
            }
        }

        // If domain_data was not in validated payload but UI extras were sent, merge into existing
        if (!updateData.domain_data && (updates.market_location || updates.certificate_url)) {
            const existing = await db.vendors.findFirst({
                where: { id: vendorId, business_id: businessId, is_deleted: false },
                select: { domain_data: true },
            });
            const merged = {
                ...(existing?.domain_data && typeof existing.domain_data === 'object' ? existing.domain_data : {}),
            };
            if (updates.market_location) merged.market_location = updates.market_location;
            if (updates.certificate_url) merged.certificate_url = updates.certificate_url;
            updateData.domain_data = merged;
        }

        if (Object.keys(updateData).length === 0) {
            const unchanged = await db.vendors.findFirst({
                where: { id: vendorId, business_id: businessId, is_deleted: false },
            });
            return {
                success: true,
                message: 'No changes',
                vendor: unchanged ? serializeDecimalsDeep(unchanged) : null,
            };
        }

        const result = await db.vendors.updateMany({
            where: {
                id: vendorId,
                business_id: businessId,
                is_deleted: false
            },
            data: updateData
        });

        if (result.count === 0) {
            return { success: false, error: 'Vendor not found or deleted' };
        }

        // Fetch updated vendor
        const vendor = await db.vendors.findFirst({
            where: { id: vendorId, business_id: businessId }
        });

        auditWrite({
            businessId,
            action: 'update',
            entityType: 'vendor',
            entityId: vendorId,
            description: `Updated vendor: ${vendor?.name || vendorId}`,
        });

        return { success: true, vendor: vendor ? serializeDecimalsDeep(vendor) : null };
    } catch (error) {
        console.error('updateVendorAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete vendor (Soft Delete)
 */
export async function deleteVendorAction(businessId, vendorId) {
    try {
        await checkAuth(businessId, 'vendors.delete');

        // Tenant isolation check (Prisma-native)
        await assertEntityBelongsToBusiness(null, 'vendor', vendorId, businessId);

        const result = await db.vendors.updateMany({
            where: {
                id: vendorId,
                business_id: businessId
            },
            data: {
                is_deleted: true,
                is_active: false,
                deleted_at: new Date()
            }
        });

        if (result.count === 0) {
            return { success: false, error: 'Vendor not found' };
        }

        auditWrite({
            businessId,
            action: 'delete',
            entityType: 'vendor',
            entityId: vendorId,
            description: `Soft-deleted vendor ${vendorId}`,
        });

        return { success: true, message: 'Vendor soft-deleted successfully' };
    } catch (error) {
        console.error('deleteVendorAction Error:', error);
        return { success: false, error: error.message };
    }
}
