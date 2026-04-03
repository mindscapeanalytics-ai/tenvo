/**
 * useSerialTracking Hook
 * 
 * Enterprise-grade serial number tracking hook with warranty management,
 * bulk registration, and multi-location support for inventory management.
 * 
 * Features:
 * - Individual unit tracking (IMEI, chassis numbers, MAC addresses)
 * - Warranty period calculation and status tracking
 * - Bulk serial registration from paste/import
 * - Serial status management (available, sold, returned, defective, under_repair)
 * - Multi-location warehouse support
 * - Optimistic updates for better UX
 * - Comprehensive error handling
 * 
 * @module hooks/useSerialTracking
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/db';

/**
 * Custom hook for serial number tracking operations
 * 
 * @param {string} productId - Product UUID
 * @param {string} businessId - Business UUID
 * @param {string} [warehouseId] - Optional warehouse UUID for location-specific serials
 * @returns {Object} Serial tracking state and operations
 */
export function useSerialTracking(productId, businessId, warehouseId = null) {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

  /**
   * Fetch serials for the product
   */
  const fetchSerials = useCallback(async () => {
    if (!productId || !businessId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('product_serials')
        .select(`
          *,
          warehouse:warehouses(id, name, code),
          customer:customers(id, name, phone),
          invoice:invoices(id, invoice_number, invoice_date)
        `)
        .eq('product_id', productId)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      // Filter by warehouse if specified
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Enrich with warranty status
      const enrichedSerials = (data || []).map(serial => ({
        ...serial,
        warrantyStatus: getWarrantyStatus(serial.warranty_end_date),
        daysUntilWarrantyExpiry: serial.warranty_end_date
          ? Math.ceil((new Date(serial.warranty_end_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      }));

      setSerials(enrichedSerials);
    } catch (err) {
      console.error('Error fetching serials:', err);
      setError(err.message || 'Failed to fetch serials');
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, warehouseId, supabase]);

  /**
   * Register a single serial number
   * 
   * @param {Object} serialData - Serial information
   * @param {string} serialData.serial_number - Unique serial number
   * @param {string} [serialData.imei] - IMEI for mobile devices
   * @param {string} [serialData.mac_address] - MAC address for network devices
   * @param {number} [serialData.warranty_period_months=12] - Warranty period in months
   * @param {string} [serialData.purchase_date] - Purchase date (ISO format)
   * @param {string} [serialData.warehouse_id] - Warehouse location
   * @param {string} [serialData.notes] - Additional notes
   * @returns {Promise<Object>} Created serial
   */
  const registerSerial = useCallback(async (serialData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!serialData.serial_number || !serialData.serial_number.trim()) {
        throw new Error('Serial number is required');
      }

      const warrantyPeriodMonths = serialData.warranty_period_months || 12;
      const purchaseDate = serialData.purchase_date || new Date().toISOString().split('T')[0];
      
      // Calculate warranty dates
      const warrantyStartDate = new Date(purchaseDate);
      const warrantyEndDate = new Date(warrantyStartDate);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyPeriodMonths);

      const newSerial = {
        business_id: businessId,
        product_id: productId,
        serial_number: serialData.serial_number.trim().toUpperCase(),
        imei: serialData.imei?.trim() || null,
        mac_address: serialData.mac_address?.trim() || null,
        status: 'available',
        purchase_date: purchaseDate,
        warranty_start_date: warrantyStartDate.toISOString().split('T')[0],
        warranty_end_date: warrantyEndDate.toISOString().split('T')[0],
        warranty_period_months: warrantyPeriodMonths,
        warehouse_id: serialData.warehouse_id || warehouseId || null,
        notes: serialData.notes || null
      };

      const { data, error: insertError } = await supabase
        .from('product_serials')
        .insert([newSerial])
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `)
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Serial number already exists');
        }
        throw insertError;
      }

      // Enrich and add to local state
      const enrichedSerial = {
        ...data,
        warrantyStatus: getWarrantyStatus(data.warranty_end_date),
        daysUntilWarrantyExpiry: Math.ceil(
          (new Date(data.warranty_end_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
      };

      setSerials(prev => [enrichedSerial, ...prev]);

      return enrichedSerial;
    } catch (err) {
      console.error('Error registering serial:', err);
      setError(err.message || 'Failed to register serial');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, warehouseId, supabase]);

  /**
   * Bulk register multiple serial numbers
   * Useful for importing serials from a list or scanning multiple units
   * 
   * @param {Array<Object>} serialsData - Array of serial information
   * @param {string} serialsData[].serial_number - Unique serial number
   * @param {number} [serialsData[].warranty_period_months=12] - Warranty period
   * @returns {Promise<Object>} Result with created serials and errors
   */
  const bulkRegisterSerials = useCallback(async (serialsData) => {
    setLoading(true);
    setError(null);

    try {
      if (!serialsData || serialsData.length === 0) {
        throw new Error('No serials provided');
      }

      // Validate and prepare serials
      const purchaseDate = new Date().toISOString().split('T')[0];
      const preparedSerials = [];
      const validationErrors = [];

      for (let i = 0; i < serialsData.length; i++) {
        const serialData = serialsData[i];
        
        if (!serialData.serial_number || !serialData.serial_number.trim()) {
          validationErrors.push({
            index: i,
            serial: serialData.serial_number,
            error: 'Serial number is required'
          });
          continue;
        }

        const warrantyPeriodMonths = serialData.warranty_period_months || 12;
        const warrantyStartDate = new Date(purchaseDate);
        const warrantyEndDate = new Date(warrantyStartDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyPeriodMonths);

        preparedSerials.push({
          business_id: businessId,
          product_id: productId,
          serial_number: serialData.serial_number.trim().toUpperCase(),
          imei: serialData.imei?.trim() || null,
          mac_address: serialData.mac_address?.trim() || null,
          status: 'available',
          purchase_date: purchaseDate,
          warranty_start_date: warrantyStartDate.toISOString().split('T')[0],
          warranty_end_date: warrantyEndDate.toISOString().split('T')[0],
          warranty_period_months: warrantyPeriodMonths,
          warehouse_id: serialData.warehouse_id || warehouseId || null,
          notes: serialData.notes || null
        });
      }

      if (preparedSerials.length === 0) {
        throw new Error('No valid serials to register');
      }

      // Bulk insert
      const { data, error: insertError } = await supabase
        .from('product_serials')
        .insert(preparedSerials)
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('One or more serial numbers already exist');
        }
        throw insertError;
      }

      // Enrich and add to local state
      const enrichedSerials = (data || []).map(serial => ({
        ...serial,
        warrantyStatus: getWarrantyStatus(serial.warranty_end_date),
        daysUntilWarrantyExpiry: Math.ceil(
          (new Date(serial.warranty_end_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
      }));

      setSerials(prev => [...enrichedSerials, ...prev]);

      return {
        success: true,
        created: enrichedSerials,
        count: enrichedSerials.length,
        errors: validationErrors
      };
    } catch (err) {
      console.error('Error bulk registering serials:', err);
      setError(err.message || 'Failed to bulk register serials');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, warehouseId, supabase]);

  /**
   * Update serial status
   * 
   * @param {string} serialId - Serial UUID
   * @param {string} status - New status (available, sold, returned, defective, under_repair)
   * @param {Object} [additionalData] - Additional data for status change
   * @param {string} [additionalData.customer_id] - Customer UUID (for sold status)
   * @param {string} [additionalData.invoice_id] - Invoice UUID (for sold status)
   * @param {string} [additionalData.notes] - Notes about status change
   * @returns {Promise<Object>} Updated serial
   */
  const updateSerialStatus = useCallback(async (serialId, status, additionalData = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Validate status
      const validStatuses = ['available', 'sold', 'returned', 'defective', 'under_repair'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updates = {
        status,
        ...additionalData
      };

      // Add sold date if status is sold
      if (status === 'sold' && !additionalData.sold_date) {
        updates.sold_date = new Date().toISOString().split('T')[0];
      }

      const { data, error: updateError } = await supabase
        .from('product_serials')
        .update(updates)
        .eq('id', serialId)
        .eq('business_id', businessId)
        .select(`
          *,
          warehouse:warehouses(id, name, code),
          customer:customers(id, name, phone),
          invoice:invoices(id, invoice_number, invoice_date)
        `)
        .single();

      if (updateError) throw updateError;

      // Update local state
      const enrichedSerial = {
        ...data,
        warrantyStatus: getWarrantyStatus(data.warranty_end_date),
        daysUntilWarrantyExpiry: data.warranty_end_date
          ? Math.ceil((new Date(data.warranty_end_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      };

      setSerials(prev => prev.map(s => s.id === serialId ? enrichedSerial : s));

      return enrichedSerial;
    } catch (err) {
      console.error('Error updating serial status:', err);
      setError(err.message || 'Failed to update serial status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [businessId, supabase]);

  /**
   * Get warranty status for a serial
   * 
   * @param {string} serialId - Serial UUID
   * @returns {Object|null} Warranty information
   */
  const getWarrantyStatus = useCallback((serialId) => {
    const serial = serials.find(s => s.id === serialId);
    if (!serial || !serial.warranty_end_date) return null;

    const warrantyEndDate = new Date(serial.warranty_end_date);
    const today = new Date();
    const daysRemaining = Math.ceil((warrantyEndDate - today) / (1000 * 60 * 60 * 24));

    return {
      status: daysRemaining > 0 ? 'active' : 'expired',
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      expiryDate: serial.warranty_end_date,
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30
    };
  }, [serials]);

  /**
   * Get available serials (not sold, not defective)
   * 
   * @returns {Array} Available serials
   */
  const getAvailableSerials = useCallback(() => {
    return serials.filter(s => s.status === 'available');
  }, [serials]);

  /**
   * Get serials by status
   * 
   * @param {string} status - Status to filter by
   * @returns {Array} Filtered serials
   */
  const getSerialsByStatus = useCallback((status) => {
    return serials.filter(s => s.status === status);
  }, [serials]);

  /**
   * Get serials with expiring warranty
   * 
   * @param {number} days - Days threshold (default: 30)
   * @returns {Array} Serials with warranty expiring within threshold
   */
  const getExpiringWarrantySerials = useCallback((days = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    return serials.filter(s => {
      if (!s.warranty_end_date || s.status !== 'sold') return false;
      const warrantyEndDate = new Date(s.warranty_end_date);
      return warrantyEndDate <= thresholdDate && warrantyEndDate >= new Date();
    }).sort((a, b) => new Date(a.warranty_end_date) - new Date(b.warranty_end_date));
  }, [serials]);

  /**
   * Search serials by serial number, IMEI, or MAC address
   * 
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching serials
   */
  const searchSerials = useCallback((searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return serials;

    const term = searchTerm.trim().toLowerCase();
    return serials.filter(s => 
      s.serial_number?.toLowerCase().includes(term) ||
      s.imei?.toLowerCase().includes(term) ||
      s.mac_address?.toLowerCase().includes(term)
    );
  }, [serials]);

  /**
   * Get serial statistics
   * 
   * @returns {Object} Statistics summary
   */
  const getStatistics = useCallback(() => {
    const total = serials.length;
    const available = serials.filter(s => s.status === 'available').length;
    const sold = serials.filter(s => s.status === 'sold').length;
    const defective = serials.filter(s => s.status === 'defective').length;
    const underRepair = serials.filter(s => s.status === 'under_repair').length;
    const returned = serials.filter(s => s.status === 'returned').length;

    const inWarranty = serials.filter(s => 
      s.warranty_end_date && new Date(s.warranty_end_date) >= new Date()
    ).length;

    const warrantyExpired = serials.filter(s => 
      s.warranty_end_date && new Date(s.warranty_end_date) < new Date()
    ).length;

    return {
      total,
      available,
      sold,
      defective,
      underRepair,
      returned,
      inWarranty,
      warrantyExpired,
      availablePercentage: total > 0 ? Math.round((available / total) * 100) : 0,
      soldPercentage: total > 0 ? Math.round((sold / total) * 100) : 0
    };
  }, [serials]);

  // Fetch serials on mount and when dependencies change
  useEffect(() => {
    fetchSerials();
  }, [fetchSerials]);

  return {
    serials,
    loading,
    error,
    registerSerial,
    bulkRegisterSerials,
    updateSerialStatus,
    getWarrantyStatus,
    getAvailableSerials,
    getSerialsByStatus,
    getExpiringWarrantySerials,
    searchSerials,
    getStatistics,
    refetch: fetchSerials
  };
}

/**
 * Helper function to determine warranty status
 * 
 * @param {string|null} warrantyEndDate - Warranty end date in ISO format
 * @returns {string} Status: 'active', 'expiring_soon', or 'expired'
 */
function getWarrantyStatus(warrantyEndDate) {
  if (!warrantyEndDate) return 'no_warranty';

  const today = new Date();
  const endDate = new Date(warrantyEndDate);
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'expiring_soon';
  return 'active';
}

export default useSerialTracking;
