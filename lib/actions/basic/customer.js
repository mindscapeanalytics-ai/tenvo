'use server';

import { db } from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { checkPlanLimit } from '@/lib/auth/planGuard';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';
import { customerSchema, validateWithSchema } from '@/lib/validation/schemas';

async function checkAuth(businessId, permission = 'customers.view') {
    const { session } = await withGuard(businessId, { permission });
    return session;
}

/**
 * Merge UI-only market_location into domain_data (no dedicated Prisma column).
 * @param {Record<string, unknown> | null | undefined} domainData
 * @param {string | null | undefined} marketLocation
 */
function mergeCustomerDomainData(domainData, marketLocation) {
    const merged =
        domainData && typeof domainData === 'object' && !Array.isArray(domainData)
            ? { ...domainData }
            : {};
    const loc = typeof marketLocation === 'string' ? marketLocation.trim() : '';
    if (loc) {
        merged.market_location = loc;
        // Keep normalized domain-field key in sync when present on forms
        if (!merged.marketlocation) merged.marketlocation = loc;
    }
    return merged;
}

function emptyToNull(value) {
    if (value == null) return null;
    if (typeof value === 'string' && !value.trim()) return null;
    return value;
}

export async function getCustomersAction(businessId) {
    try {
        await checkAuth(businessId, 'customers.view');

        const customers = await db.customers.findMany({
            where: {
                business_id: businessId,
                is_deleted: false,
                is_active: true
            },
            orderBy: { created_at: 'desc' }
        });
        
        return { success: true, customers: /** @type {unknown[]} */ (serializeDecimalsDeep(customers)) };
    } catch (error) {
        console.error('getCustomersAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createCustomerAction(customerData) {
    try {
        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        const sanitizedData = { ...customerData };
        numericFields.forEach((field) => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = Number.isFinite(val) ? val : 0;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        const validation = validateWithSchema(customerSchema, sanitizedData);
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

        await checkAuth(validated.business_id, 'customers.create');

        const currentCustomerCount = await db.customers.count({
            where: {
                business_id: validated.business_id,
                is_deleted: false
            }
        });
        
        await checkPlanLimit(validated.business_id, 'max_customers', currentCustomerCount + 1, null);

        const domain_data = mergeCustomerDomainData(
            validated.domain_data,
            customerData.market_location || validated.market_location
        );

        const customer = await db.customers.create({
            data: {
                business_id: validated.business_id,
                name: validated.name,
                email: emptyToNull(validated.email),
                phone: emptyToNull(validated.phone),
                address: emptyToNull(validated.address),
                city: emptyToNull(validated.city),
                state: emptyToNull(validated.state),
                pincode: emptyToNull(validated.pincode),
                country: emptyToNull(validated.country) || 'Pakistan',
                ntn: emptyToNull(validated.ntn),
                cnic: emptyToNull(validated.cnic),
                srn: emptyToNull(validated.srn),
                credit_limit: Number(validated.credit_limit || 0),
                outstanding_balance: Number(validated.outstanding_balance || 0),
                opening_balance: Number(validated.opening_balance || 0),
                filer_status: validated.filer_status || 'none',
                type: validated.type || 'individual',
                notes: emptyToNull(validated.notes),
                domain_data,
                is_active: true,
                is_deleted: false,
            }
        });

        auditWrite({
            businessId: validated.business_id,
            action: 'create',
            entityType: 'customer',
            entityId: customer.id,
            description: `Created customer: ${customer.name}`,
            metadata: { openingBalance: customer.opening_balance, type: customer.type }
        });

        return { success: true, customer: serializeDecimalsDeep(customer) };
    } catch (error) {
        console.error('createCustomerAction Error:', error);
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

export async function updateCustomerAction(id, businessId, updates) {
    try {
        await checkAuth(businessId, 'customers.edit');
        
        const cleanUpdates = { ...updates };
        if (cleanUpdates.tax_id) {
            cleanUpdates.ntn = cleanUpdates.tax_id;
            delete cleanUpdates.tax_id;
        }

        const numericFields = ['credit_limit', 'opening_balance', 'outstanding_balance'];
        numericFields.forEach((field) => {
            if (cleanUpdates[field] !== undefined) {
                if (typeof cleanUpdates[field] === 'string') {
                    const val = parseFloat(cleanUpdates[field]);
                    cleanUpdates[field] = Number.isFinite(val) ? val : 0;
                } else if (cleanUpdates[field] === null) {
                    cleanUpdates[field] = 0;
                }
            }
        });

        const validation = validateWithSchema(customerSchema, {
            ...cleanUpdates,
            business_id: businessId,
        });
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

        const allowedUpdates = [
            'name', 'email', 'phone', 'address', 'city',
            'state', 'pincode', 'country',
            'ntn', 'cnic', 'srn',
            'credit_limit', 'outstanding_balance', 'opening_balance', 'filer_status',
            'type', 'notes', 'is_active',
            'domain_data'
        ];

        const updateData = {};
        for (const key of Object.keys(cleanUpdates)) {
            if (allowedUpdates.includes(key)) {
                if (key === 'domain_data') {
                    updateData[key] = mergeCustomerDomainData(
                        cleanUpdates[key],
                        cleanUpdates.market_location
                    );
                } else if (numericFields.includes(key)) {
                    updateData[key] = Number(cleanUpdates[key] || 0);
                } else if (typeof cleanUpdates[key] === 'string') {
                    updateData[key] = emptyToNull(cleanUpdates[key]);
                } else {
                    updateData[key] = cleanUpdates[key];
                }
            }
        }

        if (!updateData.domain_data && cleanUpdates.market_location) {
            const existing = await db.customers.findFirst({
                where: { id, business_id: businessId, is_deleted: false },
                select: { domain_data: true },
            });
            updateData.domain_data = mergeCustomerDomainData(
                existing?.domain_data,
                cleanUpdates.market_location
            );
        }

        if (Object.keys(updateData).length === 0) {
            const unchanged = await db.customers.findFirst({
                where: { id: id, business_id: businessId, is_deleted: false },
            });
            return {
                success: true,
                message: 'No changes',
                customer: unchanged ? serializeDecimalsDeep(unchanged) : null,
            };
        }

        const result = await db.customers.updateMany({
            where: {
                id: id,
                business_id: businessId,
                is_deleted: false
            },
            data: updateData
        });

        if (result.count === 0) return { success: false, error: 'Customer not found or deleted' };
        
        const customer = await db.customers.findFirst({
            where: { id: id, business_id: businessId }
        });

        auditWrite({
            businessId: businessId,
            action: 'update',
            entityType: 'customer',
            entityId: id,
            description: `Updated customer: ${customer?.name || id}`,
        });

        return { success: true, customer: customer ? serializeDecimalsDeep(customer) : null };
    } catch (error) {
        console.error('updateCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCustomerAction(id, businessId) {
    try {
        await checkAuth(businessId, 'customers.delete');
        
        const result = await db.customers.updateMany({
            where: {
                id: id,
                business_id: businessId
            },
            data: {
                is_deleted: true,
                is_active: false,
                deleted_at: new Date()
            }
        });

        if (result.count === 0) return { success: false, error: 'Customer not found' };

        auditWrite({
            businessId: businessId,
            action: 'delete',
            entityType: 'customer',
            entityId: id,
            description: `Soft-deleted customer ${id}`,
        });

        return { success: true, message: 'Customer soft-deleted successfully' };
    } catch (error) {
        console.error('deleteCustomerAction Error:', error);
        return { success: false, error: error.message };
    }
}
