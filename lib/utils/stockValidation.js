/**
 * Stock Validation Utilities
 * 
 * Provides functions for validating stock availability across multiple locations
 * to prevent overselling and ensure accurate inventory management.
 * 
 * Key Features:
 * - Multi-location stock aggregation
 * - Reserved quantity consideration
 * - Overselling prevention
 * - User-friendly error messages
 * 
 * @module lib/utils/stockValidation
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Check available stock across all locations for a product
 * 
 * This function queries all product_locations for a given product and sums
 * the available quantities (quantity - reserved_quantity) across all warehouses.
 * It prevents overselling by comparing the requested quantity with total available stock.
 * 
 * @param {string} productId - Product UUID
 * @param {string} businessId - Business UUID
 * @param {number} requestedQuantity - Quantity requested for sale/reservation
 * @returns {Promise<Object>} Validation result
 * @returns {boolean} result.success - Whether the operation succeeded
 * @returns {boolean} result.available - Whether sufficient stock is available
 * @returns {number} result.totalAvailable - Total available quantity across all locations
 * @returns {number} result.totalReserved - Total reserved quantity across all locations
 * @returns {number} result.requestedQuantity - The requested quantity
 * @returns {Array} result.locationBreakdown - Stock breakdown by location
 * @returns {string} result.message - User-friendly message
 * @returns {string} result.error - Error message if operation failed
 * 
 * @example
 * const result = await checkAvailableStock('product-uuid', 'business-uuid', 50);
 * if (!result.available) {
 *   alert(result.message); // "Insufficient stock. Available: 30, Requested: 50"
 * }
 */
export async function checkAvailableStock(productId, businessId, requestedQuantity) {
  // Input validation
  if (!productId || !businessId) {
    return {
      success: false,
      error: 'Product ID and Business ID are required'
    };
  }

  if (typeof requestedQuantity !== 'number' || requestedQuantity <= 0) {
    return {
      success: false,
      error: 'Requested quantity must be a positive number'
    };
  }

  try {
    const supabase = createClient();

    // Query all product_locations for this product
    const { data: locations, error: queryError } = await supabase
      .from('product_locations')
      .select(`
        id,
        warehouse_id,
        quantity,
        reserved_quantity,
        available_quantity,
        warehouses (
          id,
          name,
          location
        )
      `)
      .eq('business_id', businessId)
      .eq('product_id', productId);

    if (queryError) {
      console.error('Stock validation query error:', queryError);
      return {
        success: false,
        error: `Database error: ${queryError.message}`
      };
    }

    // Handle case where product has no location records
    if (!locations || locations.length === 0) {
      return {
        success: true,
        available: false,
        totalAvailable: 0,
        totalReserved: 0,
        requestedQuantity,
        locationBreakdown: [],
        message: 'No stock available at any location'
      };
    }

    // Calculate total available and reserved quantities
    let totalAvailable = 0;
    let totalReserved = 0;
    const locationBreakdown = [];

    for (const loc of locations) {
      const available = parseFloat(loc.available_quantity || 0);
      const reserved = parseFloat(loc.reserved_quantity || 0);
      
      totalAvailable += available;
      totalReserved += reserved;

      locationBreakdown.push({
        warehouseId: loc.warehouse_id,
        warehouseName: loc.warehouses?.name || 'Unknown',
        warehouseLocation: loc.warehouses?.location || '',
        quantity: parseFloat(loc.quantity || 0),
        reserved: reserved,
        available: available
      });
    }

    // Check if requested quantity exceeds total available
    const isAvailable = totalAvailable >= requestedQuantity;
    const shortage = isAvailable ? 0 : requestedQuantity - totalAvailable;

    return {
      success: true,
      available: isAvailable,
      totalAvailable,
      totalReserved,
      requestedQuantity,
      shortage,
      locationBreakdown,
      message: isAvailable
        ? `Stock available: ${totalAvailable} units across ${locations.length} location(s)`
        : `Insufficient stock. Available: ${totalAvailable}, Requested: ${requestedQuantity}, Short by: ${shortage}`
    };

  } catch (error) {
    console.error('Stock validation error:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Check available stock at a specific location
 * 
 * Similar to checkAvailableStock but for a single warehouse location.
 * Useful when stock must be fulfilled from a specific warehouse.
 * 
 * @param {string} productId - Product UUID
 * @param {string} businessId - Business UUID
 * @param {string} warehouseId - Warehouse UUID
 * @param {number} requestedQuantity - Quantity requested
 * @returns {Promise<Object>} Validation result
 */
export async function checkAvailableStockAtLocation(productId, businessId, warehouseId, requestedQuantity) {
  if (!productId || !businessId || !warehouseId) {
    return {
      success: false,
      error: 'Product ID, Business ID, and Warehouse ID are required'
    };
  }

  if (typeof requestedQuantity !== 'number' || requestedQuantity <= 0) {
    return {
      success: false,
      error: 'Requested quantity must be a positive number'
    };
  }

  try {
    const supabase = createClient();

    const { data: location, error: queryError } = await supabase
      .from('product_locations')
      .select(`
        id,
        warehouse_id,
        quantity,
        reserved_quantity,
        available_quantity,
        warehouses (
          id,
          name,
          location
        )
      `)
      .eq('business_id', businessId)
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .maybeSingle();

    if (queryError) {
      console.error('Location stock validation error:', queryError);
      return {
        success: false,
        error: `Database error: ${queryError.message}`
      };
    }

    if (!location) {
      return {
        success: true,
        available: false,
        availableQuantity: 0,
        reservedQuantity: 0,
        requestedQuantity,
        warehouseName: 'Unknown',
        message: 'No stock at this location'
      };
    }

    const available = parseFloat(location.available_quantity || 0);
    const reserved = parseFloat(location.reserved_quantity || 0);
    const isAvailable = available >= requestedQuantity;
    const shortage = isAvailable ? 0 : requestedQuantity - available;

    return {
      success: true,
      available: isAvailable,
      availableQuantity: available,
      reservedQuantity: reserved,
      requestedQuantity,
      shortage,
      warehouseId: location.warehouse_id,
      warehouseName: location.warehouses?.name || 'Unknown',
      warehouseLocation: location.warehouses?.location || '',
      message: isAvailable
        ? `Stock available at ${location.warehouses?.name}: ${available} units`
        : `Insufficient stock at ${location.warehouses?.name}. Available: ${available}, Requested: ${requestedQuantity}, Short by: ${shortage}`
    };

  } catch (error) {
    console.error('Location stock validation error:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}

/**
 * Get stock summary for a product across all locations
 * 
 * Provides a comprehensive view of stock distribution without validation.
 * Useful for displaying stock information in product details.
 * 
 * @param {string} productId - Product UUID
 * @param {string} businessId - Business UUID
 * @returns {Promise<Object>} Stock summary
 */
export async function getStockSummary(productId, businessId) {
  if (!productId || !businessId) {
    return {
      success: false,
      error: 'Product ID and Business ID are required'
    };
  }

  try {
    const supabase = createClient();

    const { data: locations, error: queryError } = await supabase
      .from('product_locations')
      .select(`
        id,
        warehouse_id,
        quantity,
        reserved_quantity,
        available_quantity,
        min_stock,
        max_stock,
        warehouses (
          id,
          name,
          location,
          is_primary
        )
      `)
      .eq('business_id', businessId)
      .eq('product_id', productId)
      .order('warehouses(is_primary)', { ascending: false });

    if (queryError) {
      console.error('Stock summary query error:', queryError);
      return {
        success: false,
        error: `Database error: ${queryError.message}`
      };
    }

    if (!locations || locations.length === 0) {
      return {
        success: true,
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        locationCount: 0,
        locations: []
      };
    }

    let totalQuantity = 0;
    let totalReserved = 0;
    let totalAvailable = 0;

    const locationSummary = locations.map(loc => {
      const qty = parseFloat(loc.quantity || 0);
      const reserved = parseFloat(loc.reserved_quantity || 0);
      const available = parseFloat(loc.available_quantity || 0);

      totalQuantity += qty;
      totalReserved += reserved;
      totalAvailable += available;

      return {
        warehouseId: loc.warehouse_id,
        warehouseName: loc.warehouses?.name || 'Unknown',
        warehouseLocation: loc.warehouses?.location || '',
        isPrimary: loc.warehouses?.is_primary || false,
        quantity: qty,
        reserved: reserved,
        available: available,
        minStock: parseFloat(loc.min_stock || 0),
        maxStock: parseFloat(loc.max_stock || 0),
        isLowStock: available <= parseFloat(loc.min_stock || 0)
      };
    });

    return {
      success: true,
      totalQuantity,
      totalReserved,
      totalAvailable,
      locationCount: locations.length,
      locations: locationSummary
    };

  } catch (error) {
    console.error('Stock summary error:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}
