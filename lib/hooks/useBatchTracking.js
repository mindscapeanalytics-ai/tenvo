/**
 * useBatchTracking Hook
 * 
 * Enterprise-grade batch tracking hook with FEFO logic, merge/split operations,
 * and multi-location support for inventory management.
 * 
 * Features:
 * - FEFO (First Expiry First Out) automatic sorting
 * - Batch merging with weighted average cost calculation
 * - Batch splitting with quantity preservation
 * - Expiry alerts (90/30/7 days)
 * - Multi-location warehouse support
 * - Optimistic updates for better UX
 * - Comprehensive error handling
 * 
 * @module hooks/useBatchTracking
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Custom hook for batch tracking operations
 * 
 * @param {string} productId - Product UUID
 * @param {string} businessId - Business UUID
 * @param {string} [warehouseId] - Optional warehouse UUID for location-specific batches
 * @returns {Object} Batch tracking state and operations
 */
export function useBatchTracking(productId, businessId, warehouseId = null) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

  /**
   * Fetch batches with FEFO sorting
   * Sorts by expiry date (earliest first) for optimal stock rotation
   */
  const fetchBatches = useCallback(async () => {
    if (!productId || !businessId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('product_batches')
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `)
        .eq('product_id', productId)
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('receipt_date', { ascending: true });

      // Filter by warehouse if specified
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calculate days until expiry and add expiry status
      const enrichedBatches = (data || []).map(batch => ({
        ...batch,
        daysUntilExpiry: batch.expiry_date 
          ? Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        expiryStatus: getExpiryStatus(batch.expiry_date),
        availableQty: parseFloat(batch.available_quantity || batch.quantity || 0),
        reservedQty: parseFloat(batch.reserved_quantity || 0)
      }));

      setBatches(enrichedBatches);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.message || 'Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, warehouseId, supabase]);

  /**
   * Add a new batch
   * 
   * @param {Object} batchData - Batch information
   * @param {string} batchData.batch_number - Unique batch number
   * @param {string} [batchData.manufacturing_date] - Manufacturing date (ISO format)
   * @param {string} [batchData.expiry_date] - Expiry date (ISO format)
   * @param {number} batchData.quantity - Batch quantity
   * @param {number} batchData.cost_price - Cost price per unit
   * @param {number} [batchData.mrp] - Maximum retail price
   * @param {string} [batchData.warehouse_id] - Warehouse location
   * @param {string} [batchData.notes] - Additional notes
   * @returns {Promise<Object>} Created batch
   */
  const addBatch = useCallback(async (batchData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!batchData.batch_number) {
        throw new Error('Batch number is required');
      }
      if (!batchData.quantity || batchData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (!batchData.cost_price || batchData.cost_price < 0) {
        throw new Error('Cost price must be 0 or greater');
      }

      // Validate date logic
      if (batchData.manufacturing_date && batchData.expiry_date) {
        const mfgDate = new Date(batchData.manufacturing_date);
        const expDate = new Date(batchData.expiry_date);
        if (expDate <= mfgDate) {
          throw new Error('Expiry date must be after manufacturing date');
        }
      }

      const newBatch = {
        business_id: businessId,
        product_id: productId,
        batch_number: batchData.batch_number.trim(),
        manufacturing_date: batchData.manufacturing_date || null,
        expiry_date: batchData.expiry_date || null,
        quantity: parseFloat(batchData.quantity),
        cost_price: parseFloat(batchData.cost_price),
        mrp: batchData.mrp ? parseFloat(batchData.mrp) : null,
        warehouse_id: batchData.warehouse_id || warehouseId || null,
        notes: batchData.notes || null,
        status: 'active',
        receipt_date: new Date().toISOString().split('T')[0],
        reserved_quantity: 0
      };

      const { data, error: insertError } = await supabase
        .from('product_batches')
        .insert([newBatch])
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `)
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Batch number already exists for this product');
        }
        throw insertError;
      }

      // Optimistic update
      const enrichedBatch = {
        ...data,
        daysUntilExpiry: data.expiry_date 
          ? Math.ceil((new Date(data.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        expiryStatus: getExpiryStatus(data.expiry_date),
        availableQty: parseFloat(data.available_quantity || data.quantity || 0),
        reservedQty: parseFloat(data.reserved_quantity || 0)
      };

      setBatches(prev => [...prev, enrichedBatch].sort((a, b) => {
        // FEFO sorting
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      }));

      return enrichedBatch;
    } catch (err) {
      console.error('Error adding batch:', err);
      setError(err.message || 'Failed to add batch');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, warehouseId, supabase]);

  /**
   * Update an existing batch
   * 
   * @param {string} batchId - Batch UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated batch
   */
  const updateBatch = useCallback(async (batchId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('product_batches')
        .update(updates)
        .eq('id', batchId)
        .eq('business_id', businessId)
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `)
        .single();

      if (updateError) throw updateError;

      // Update local state
      const enrichedBatch = {
        ...data,
        daysUntilExpiry: data.expiry_date 
          ? Math.ceil((new Date(data.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        expiryStatus: getExpiryStatus(data.expiry_date),
        availableQty: parseFloat(data.available_quantity || data.quantity || 0),
        reservedQty: parseFloat(data.reserved_quantity || 0)
      };

      setBatches(prev => prev.map(b => b.id === batchId ? enrichedBatch : b));

      return enrichedBatch;
    } catch (err) {
      console.error('Error updating batch:', err);
      setError(err.message || 'Failed to update batch');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [businessId, supabase]);

  /**
   * Delete a batch (soft delete by setting status to 'expired')
   * 
   * @param {string} batchId - Batch UUID
   * @returns {Promise<void>}
   */
  const deleteBatch = useCallback(async (batchId) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('product_batches')
        .update({ status: 'expired' })
        .eq('id', batchId)
        .eq('business_id', businessId);

      if (deleteError) throw deleteError;

      // Remove from local state
      setBatches(prev => prev.filter(b => b.id !== batchId));
    } catch (err) {
      console.error('Error deleting batch:', err);
      setError(err.message || 'Failed to delete batch');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [businessId, supabase]);

  /**
   * Merge multiple batches into a single batch
   * Calculates weighted average cost and uses earliest expiry date
   * 
   * @param {string[]} batchIds - Array of batch UUIDs to merge
   * @param {string} newBatchNumber - New batch number for merged batch
   * @returns {Promise<Object>} Merged batch
   */
  const mergeBatches = useCallback(async (batchIds, newBatchNumber) => {
    setLoading(true);
    setError(null);

    try {
      if (!batchIds || batchIds.length < 2) {
        throw new Error('At least 2 batches required for merging');
      }

      // Fetch batches to merge
      const { data: batchesToMerge, error: fetchError } = await supabase
        .from('product_batches')
        .select('*')
        .in('id', batchIds)
        .eq('business_id', businessId)
        .eq('product_id', productId)
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      if (batchesToMerge.length !== batchIds.length) {
        throw new Error('Some batches not found or not active');
      }

      // Check if any batch has been partially sold or reserved
      const hasReserved = batchesToMerge.some(b => 
        parseFloat(b.reserved_quantity || 0) > 0 || 
        parseFloat(b.quantity) !== parseFloat(b.available_quantity || b.quantity)
      );

      if (hasReserved) {
        throw new Error('Cannot merge batches that have been partially sold or reserved');
      }

      // Calculate weighted average cost
      const totalQuantity = batchesToMerge.reduce((sum, b) => sum + parseFloat(b.quantity), 0);
      const totalCost = batchesToMerge.reduce((sum, b) => 
        sum + (parseFloat(b.quantity) * parseFloat(b.cost_price)), 0
      );
      const weightedAvgCost = totalCost / totalQuantity;

      // Find earliest expiry date
      const expiryDates = batchesToMerge
        .map(b => b.expiry_date)
        .filter(d => d !== null)
        .sort();
      const earliestExpiry = expiryDates.length > 0 ? expiryDates[0] : null;

      // Create merged batch
      const mergedBatch = {
        business_id: businessId,
        product_id: productId,
        batch_number: newBatchNumber.trim(),
        manufacturing_date: batchesToMerge[0].manufacturing_date,
        expiry_date: earliestExpiry,
        quantity: totalQuantity,
        cost_price: Math.round(weightedAvgCost * 100) / 100, // Round to 2 decimals
        mrp: batchesToMerge[0].mrp,
        warehouse_id: batchesToMerge[0].warehouse_id,
        status: 'active',
        is_merged: true,
        receipt_date: new Date().toISOString().split('T')[0],
        reserved_quantity: 0,
        notes: `Merged from batches: ${batchesToMerge.map(b => b.batch_number).join(', ')}`
      };

      const { data: newBatch, error: insertError } = await supabase
        .from('product_batches')
        .insert([mergedBatch])
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `)
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Batch number already exists');
        }
        throw insertError;
      }

      // Mark source batches as merged
      const { error: updateError } = await supabase
        .from('product_batches')
        .update({ status: 'merged' })
        .in('id', batchIds);

      if (updateError) throw updateError;

      // Update local state
      const enrichedBatch = {
        ...newBatch,
        daysUntilExpiry: newBatch.expiry_date 
          ? Math.ceil((new Date(newBatch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        expiryStatus: getExpiryStatus(newBatch.expiry_date),
        availableQty: parseFloat(newBatch.available_quantity || newBatch.quantity || 0),
        reservedQty: parseFloat(newBatch.reserved_quantity || 0)
      };

      setBatches(prev => [
        ...prev.filter(b => !batchIds.includes(b.id)),
        enrichedBatch
      ].sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      }));

      return enrichedBatch;
    } catch (err) {
      console.error('Error merging batches:', err);
      setError(err.message || 'Failed to merge batches');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, supabase]);

  /**
   * Split a batch into multiple smaller batches
   * Preserves expiry date and cost price for all splits
   * 
   * @param {string} batchId - Batch UUID to split
   * @param {Array<{quantity: number, batch_number: string}>} splits - Split specifications
   * @returns {Promise<Array>} Array of split batches
   */
  const splitBatch = useCallback(async (batchId, splits) => {
    setLoading(true);
    setError(null);

    try {
      if (!splits || splits.length < 2) {
        throw new Error('At least 2 splits required');
      }

      // Fetch original batch
      const { data: originalBatch, error: fetchError } = await supabase
        .from('product_batches')
        .select('*')
        .eq('id', batchId)
        .eq('business_id', businessId)
        .eq('status', 'active')
        .single();

      if (fetchError) throw fetchError;

      // Validate split quantities
      const totalSplitQty = splits.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
      const originalQty = parseFloat(originalBatch.quantity);

      if (Math.abs(totalSplitQty - originalQty) > 0.01) {
        throw new Error(`Split quantities (${totalSplitQty}) must equal original quantity (${originalQty})`);
      }

      // Check if batch has been partially sold or reserved
      if (parseFloat(originalBatch.reserved_quantity || 0) > 0) {
        throw new Error('Cannot split batch that has reserved quantity');
      }

      // Create split batches
      const splitBatches = splits.map((split, index) => ({
        business_id: businessId,
        product_id: productId,
        batch_number: split.batch_number || `${originalBatch.batch_number}-S${index + 1}`,
        manufacturing_date: originalBatch.manufacturing_date,
        expiry_date: originalBatch.expiry_date,
        quantity: parseFloat(split.quantity),
        cost_price: originalBatch.cost_price,
        mrp: originalBatch.mrp,
        warehouse_id: originalBatch.warehouse_id,
        status: 'active',
        parent_batch_id: batchId,
        receipt_date: originalBatch.receipt_date,
        reserved_quantity: 0,
        notes: `Split from batch: ${originalBatch.batch_number}`
      }));

      const { data: newBatches, error: insertError } = await supabase
        .from('product_batches')
        .insert(splitBatches)
        .select(`
          *,
          warehouse:warehouses(id, name, code)
        `);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('One or more batch numbers already exist');
        }
        throw insertError;
      }

      // Mark original batch as split
      const { error: updateError } = await supabase
        .from('product_batches')
        .update({ 
          status: 'split',
          child_batch_ids: newBatches.map(b => b.id)
        })
        .eq('id', batchId);

      if (updateError) throw updateError;

      // Update local state
      const enrichedBatches = newBatches.map(batch => ({
        ...batch,
        daysUntilExpiry: batch.expiry_date 
          ? Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        expiryStatus: getExpiryStatus(batch.expiry_date),
        availableQty: parseFloat(batch.available_quantity || batch.quantity || 0),
        reservedQty: parseFloat(batch.reserved_quantity || 0)
      }));

      setBatches(prev => [
        ...prev.filter(b => b.id !== batchId),
        ...enrichedBatches
      ].sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      }));

      return enrichedBatches;
    } catch (err) {
      console.error('Error splitting batch:', err);
      setError(err.message || 'Failed to split batch');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, supabase]);

  /**
   * Get the next batch to expire (FEFO)
   * 
   * @returns {Object|null} Next expiring batch or null
   */
  const getNextExpiryBatch = useCallback(() => {
    const activeBatches = batches.filter(b => 
      b.status === 'active' && b.availableQty > 0 && b.expiry_date
    );

    if (activeBatches.length === 0) return null;

    return activeBatches.reduce((earliest, current) => {
      if (!earliest.expiry_date) return current;
      if (!current.expiry_date) return earliest;
      return new Date(current.expiry_date) < new Date(earliest.expiry_date) 
        ? current 
        : earliest;
    });
  }, [batches]);

  /**
   * Get batches expiring within specified days
   * 
   * @param {number} days - Number of days threshold (default: 30)
   * @returns {Array} Batches expiring within threshold
   */
  const getExpiringBatches = useCallback((days = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    return batches.filter(b => {
      if (!b.expiry_date || b.status !== 'active') return false;
      const expiryDate = new Date(b.expiry_date);
      return expiryDate <= thresholdDate && expiryDate >= new Date();
    }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  }, [batches]);

  // Fetch batches on mount and when dependencies change
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    loading,
    error,
    addBatch,
    updateBatch,
    deleteBatch,
    mergeBatches,
    splitBatch,
    getNextExpiryBatch,
    getExpiringBatches,
    refetch: fetchBatches
  };
}

/**
 * Helper function to determine expiry status
 * 
 * @param {string|null} expiryDate - Expiry date in ISO format
 * @returns {string} Status: 'healthy', 'warning', 'critical', or 'expired'
 */
function getExpiryStatus(expiryDate) {
  if (!expiryDate) return 'healthy';

  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'critical';
  if (daysUntilExpiry <= 30) return 'warning';
  if (daysUntilExpiry <= 90) return 'caution';
  return 'healthy';
}

export default useBatchTracking;
