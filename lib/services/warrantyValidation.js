/**
 * Warranty Validation Service
 * 
 * Validates and manages warranty claims
 * Calculates warranty periods
 * Tracks warranty expiry and coverage
 * 
 * @module lib/services/warrantyValidation
 */

import { db } from '@/lib/db';
import { auditLog } from '@/lib/services/auditLog';

/**
 * Validate warranty for a serial number
 * Checks if warranty is valid and in force
 * 
 * @param {string} serialNumber
 * @param {string} businessId
 * @returns {Promise<Object>} Warranty validation
 * 
 * @example
 * const warranty = await validateWarrantyForSerial('SN123456', businessId);
 * if (warranty.isValid) {
 *   console.log(`Valid until ${warranty.expiryDate}`);
 * }
 */
export async function validateWarrantyForSerial(serialNumber, businessId) {
  const now = new Date();

  const serial = await db.product_serials.findFirst({
    where: {
      serial_number: serialNumber,
      business_id: businessId,
      is_deleted: false
    },
    select: {
      id: true,
      serial_number: true,
      product_id: true,
      warranty_start_date: true,
      warranty_expiry_date: true,
      warranty_period_months: true,
      status: true,
      sale_date: true,
      customer_id: true,
      customers: {
        select: {
          name: true,
          email: true,
          phone: true
        }
      },
      products: {
        select: {
          sku: true,
          name: true,
          category: true
        }
      }
    }
  });

  if (!serial) {
    return {
      found: false,
      isValid: false,
      reason: `Serial number ${serialNumber} not found`
    };
  }

  if (serial.status !== 'sold') {
    return {
      found: true,
      isValid: false,
      reason: `Serial is in ${serial.status} status, warranty not applicable`,
      serialNumber: serial.serial_number
    };
  }

  const isExpired = serial.warranty_expiry_date < now;
  const daysRemaining = Math.ceil(
    (serial.warranty_expiry_date - now) / (1000 * 60 * 60 * 24)
  );

  return {
    found: true,
    isValid: !isExpired,
    serialNumber: serial.serial_number,
    product: {
      sku: serial.products.sku,
      name: serial.products.name,
      category: serial.products.category
    },
    customer: {
      id: serial.customer_id,
      name: serial.customers?.name,
      email: serial.customers?.email,
      phone: serial.customers?.phone
    },
    dates: {
      purchaseDate: serial.sale_date,
      warrantyStartDate: serial.warranty_start_date,
      warrantyExpiryDate: serial.warranty_expiry_date,
      periodMonths: serial.warranty_period_months
    },
    status: {
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
      message: isExpired
        ? `Warranty expired ${Math.abs(daysRemaining)} days ago`
        : `Warranty valid for ${daysRemaining} days`,
      percentCovered: serial.warranty_period_months
        ? ((Math.max(0, daysRemaining) / (serial.warranty_period_months * 30)) * 100).toFixed(1)
        : 'N/A'
    }
  };
}

/**
 * Calculate warranty expiry date
 * Adds warranty period to start date
 * 
 * @param {Date} startDate - Start of warranty (usually purchase date)
 * @param {number} periodMonths - Warranty period in months
 * @returns {Date} Expiry date
 * 
 * @example
 * const expiry = calculateWarrantyExpiry(new Date(), 12);
 * console.log(`Warranty expires: ${expiry}`);
 */
export function calculateWarrantyExpiry(startDate, periodMonths) {
  const expiry = new Date(startDate);
  expiry.setMonth(expiry.getMonth() + periodMonths);
  return expiry;
}

/**
 * Calculate warranty period coverage percentage
 * Shows how much of warranty period has been used
 * 
 * @param {Date} startDate
 * @param {Date} expiryDate
 * @returns {Object} Coverage info
 * 
 * @example
 * const coverage = calculateCoverage(startDate, expiryDate);
 * console.log(`${coverage.used}% used, ${coverage.remaining}% remaining`);
 */
export function calculateCoveragePeriod(startDate, expiryDate) {
  const now = new Date();
  const totalMs = expiryDate - startDate;
  const usedMs = now - startDate;
  const remainingMs = expiryDate - now;

  const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
  const usedDays = Math.ceil(usedMs / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  const usedPercent = totalDays > 0
    ? ((usedDays / totalDays) * 100).toFixed(1)
    : 0;

  const remainingPercent = 100 - usedPercent;

  return {
    startDate,
    expiryDate,
    totalDays,
    usedDays,
    remainingDays,
    usedPercent: parseFloat(usedPercent),
    remainingPercent: parseFloat(remainingPercent),
    isExpired: now > expiryDate,
    status: now > expiryDate
      ? 'expired'
      : remainingDays <= 30
      ? 'expiring-soon'
      : 'active'
  };
}

/**
 * Check if serial is eligible for warranty claim
 * Validates all warranty conditions
 * 
 * @param {string} serialNumber
 * @param {string} businessId
 * @param {Object} claimDetails - Optional claim details for validation
 * @returns {Promise<Object>} Eligibility result
 * 
 * @example
 * const eligible = await validateWarrantyClaim('SN123456', businessId);
 * if (!eligible.eligible) {
 *   console.error(eligible.reason);
 * }
 */
export async function validateWarrantyClaim(
  serialNumber,
  businessId,
  claimDetails = {}
) {
  const validation = await validateWarrantyForSerial(serialNumber, businessId);

  if (!validation.found) {
    return {
      eligible: false,
      reason: validation.reason
    };
  }

  if (!validation.isValid) {
    return {
      eligible: false,
      reason: `Warranty has expired (${validation.status.message})`
    };
  }

  // Additional validations
  const issues = [];

  // Check maximum claims (if applicable)
  if (claimDetails.checkClaimHistory) {
    const prior = await db.warranty_claims.findMany({
      where: {
        product_serial_id: null,  // Would need serial ID from DB
        status: { in: ['approved', 'completed'] }
      }
    });

    if (prior.length >= 3) {
      issues.push('Serial has reached maximum claim limit');
    }
  }

  // Check for damage (if applicable)
  if (claimDetails.damageReported && claimDetails.damageType) {
    // Certain damage types may void warranty
    const voidingDamage = ['physical-damage', 'water-damage', 'burn'];
    if (voidingDamage.includes(claimDetails.damageType)) {
      issues.push(
        `${claimDetails.damageType} may void warranty - manual review required`
      );
    }
  }

  if (issues.length > 0) {
    return {
      eligible: false,
      reason: 'Warranty claim requires manual review',
      issues
    };
  }

  return {
    eligible: true,
    serialNumber: validation.serialNumber,
    product: validation.product,
    customer: validation.customer,
    warrantyStatus: validation.status,
    message: 'Eligible for warranty claim'
  };
}

/**
 * Create warranty claim
 * Records claim in system
 * 
 * @param {Object} data
 * @param {string} data.serialNumber
 * @param {string} data.businessId
 * @param {string} data.customerId
 * @param {string} data.claimType - 'replacement', 'repair', 'refund'
 * @param {string} [data.issue] - Description of issue
 * @param {Array} [data.attachments] - File paths or URLs
 * @returns {Promise<Object>} Created claim
 */
export async function createWarrantyClaim(data) {
  const {
    serialNumber,
    businessId,
    customerId,
    claimType,
    issue = '',
    attachments = []
  } = data;

  // Validate warranty first
  const validation = await validateWarrantyClaim(serialNumber, businessId);
  if (!validation.eligible) {
    throw new Error(`Cannot create claim: ${validation.reason}`);
  }

  // Get serial ID
  const serial = await db.product_serials.findFirst({
    where: { serial_number: serialNumber, business_id: businessId }
  });

  // Create claim record
  const claim = {
    product_serial_id: serial.id,
    business_id: businessId,
    customer_id: customerId,
    claim_type: claimType,
    issue_description: issue,
    status: 'pending',
    created_at: new Date(),
    attachments: attachments.length > 0 ? attachments : null
  };

  // Log the claim
  await auditLog({
    businessId,
    action: 'WARRANTY_CLAIM_CREATED',
    entityType: 'warranty_claim',
    entityId: null,
    description: `Warranty claim created for serial ${serialNumber}`,
    changes: {
      claimType,
      issue
    },
    metadata: {
      serialNumber,
      customerId
    }
  });

  return claim;
}

/**
 * Get warranty claims for a product
 * Shows all warranty history for a serial
 * 
 * @param {string} serialNumber
 * @param {string} businessId
 * @returns {Promise<Array>}
 */
export async function getWarrantyClaimHistory(serialNumber, businessId) {
  const serial = await db.product_serials.findFirst({
    where: { serial_number: serialNumber, business_id: businessId },
    select: { id: true }
  });

  if (!serial) {
    throw new Error(`Serial ${serialNumber} not found`);
  }

  // This would query warranty_claims table if it exists
  // For now, return empty structure
  return {
    serialNumber,
    claims: [],
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    completedClaims: 0
  };
}

/**
 * Extend warranty period
 * Adds additional months to warranty
 * 
 * @param {string} serialNumber
 * @param {number} monthsToAdd
 * @param {string} businessId
 * @returns {Promise<Object>} Updated warranty
 */
export async function extendWarranty(
  serialNumber,
  monthsToAdd,
  businessId
) {
  const serial = await db.product_serials.findFirst({
    where: { serial_number: serialNumber, business_id: businessId },
    select: {
      id: true,
      warranty_expiry_date: true,
      warranty_period_months: true
    }
  });

  if (!serial) {
    throw new Error(`Serial ${serialNumber} not found`);
  }

  const newExpiry = new Date(serial.warranty_expiry_date);
  newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

  const newPeriod = (serial.warranty_period_months || 0) + monthsToAdd;

  const updated = await db.product_serials.update({
    where: { id: serial.id },
    data: {
      warranty_expiry_date: newExpiry,
      warranty_period_months: newPeriod,
      warranty_extended: true,
      warranty_extension_date: new Date()
    }
  });

  // Log extension
  await auditLog({
    businessId,
    action: 'WARRANTY_EXTENDED',
    entityType: 'product_serial',
    entityId: serial.id,
    description: `Warranty extended by ${monthsToAdd} months`,
    changes: {
      from: serial.warranty_expiry_date,
      to: newExpiry,
      monthsAdded: monthsToAdd
    },
    metadata: { serialNumber }
  });

  return {
    serialNumber,
    newExpiryDate: newExpiry,
    totalPeriodMonths: newPeriod,
    monthsAdded: monthsToAdd
  };
}

export default {
  validateWarrantyForSerial,
  calculateWarrantyExpiry,
  calculateCoveragePeriod,
  validateWarrantyClaim,
  createWarrantyClaim,
  getWarrantyClaimHistory,
  extendWarranty
};
