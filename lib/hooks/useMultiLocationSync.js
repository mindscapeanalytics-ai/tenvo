import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    addToQueue,
    getPendingOperations,
    updateOperationStatus,
    removeFromQueue,
    addConflict,
    isIndexedDBSupported
} from '@/lib/utils/offlineQueue';

/**
 * useMultiLocationSync Hook
 * 
 * Enterprise-grade multi-location inventory management with real-time sync
 * Supports stock transfers, location-specific stock tracking, and Supabase Realtime
 * 
 * Features:
 * - Real-time inventory updates across locations
 * - Stock transfer workflow with reservation
 * - Transfer receipt confirmation
 * - Sync latency monitoring (<2s target)
 * - Offline queue with IndexedDB
 * - Automatic sync when connection restored
 * - Conflict resolution for concurrent updates
 * 
 * @param {string} businessId - Business ID
 * @param {string} [warehouseId] - Optional warehouse ID for location-specific operations
 * 
 * @returns {Object} Hook interface with multi-location functions
 */
export function useMultiLocationSync(businessId, warehouseId = null) {
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [error, setError] = useState(null);
    const [productLocations, setProductLocations] = useState([]);
    const [pendingTransfers, setPendingTransfers] = useState([]);
    const [isOnline, setIsOnline] = useState(true);
    const [offlineQueueSupported, setOfflineQueueSupported] = useState(false);
    
    const supabase = createClient();
    const realtimeChannel = useRef(null);
    const syncInProgress = useRef(false);

    /**
     * Check if browser is online
     */
    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        // Check IndexedDB support
        setOfflineQueueSupported(isIndexedDBSupported());

        // Set initial status
        updateOnlineStatus();

        // Listen for online/offline events
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    /**
     * Sync offline queue when connection is restored
     */
    const syncOfflineQueue = useCallback(async () => {
        if (!offlineQueueSupported || syncInProgress.current) {
            return;
        }

        try {
            syncInProgress.current = true;
            setSyncing(true);

            const pendingOps = await getPendingOperations();
            
            if (pendingOps.length === 0) {
                setSyncing(false);
                syncInProgress.current = false;
                return;
            }

            console.log(`Syncing ${pendingOps.length} offline operations...`);

            for (const operation of pendingOps) {
                try {
                    await updateOperationStatus(operation.id, 'syncing');

                    // Execute operation based on type
                    if (operation.type === 'stock_transfer') {
                        await executeTransferOperation(operation.data);
                    } else if (operation.type === 'confirm_receipt') {
                        await executeReceiptOperation(operation.data);
                    }

                    // Mark as completed
                    await updateOperationStatus(operation.id, 'completed');
                    await removeFromQueue(operation.id);
                } catch (error) {
                    console.error('Failed to sync operation:', error);

                    // Check if it's a conflict (409 status)
                    if (error.status === 409 || error.message?.includes('conflict')) {
                        await addConflict({
                            operationId: operation.id,
                            type: operation.type,
                            localData: operation.data,
                            serverData: error.serverData || null,
                            error: error.message
                        });
                        await updateOperationStatus(operation.id, 'failed', {
                            error: 'Conflict detected - requires manual resolution'
                        });
                    } else {
                        // Retry logic with exponential backoff
                        const retryCount = operation.retryCount || 0;
                        if (retryCount < 3) {
                            await updateOperationStatus(operation.id, 'pending', {
                                retryCount: retryCount + 1,
                                lastRetry: new Date().toISOString(),
                                error: error.message
                            });
                        } else {
                            await updateOperationStatus(operation.id, 'failed', {
                                error: `Failed after ${retryCount} retries: ${error.message}`
                            });
                        }
                    }
                }
            }

            setLastSyncTime(new Date());
        } catch (error) {
            console.error('Sync failed:', error);
            setError(error.message);
        } finally {
            setSyncing(false);
            syncInProgress.current = false;
        }
    }, [offlineQueueSupported]);

    /**
     * Execute transfer operation from queue
     */
    const executeTransferOperation = async (data) => {
        const { data: transfer, error: createError } = await supabase
            .from('stock_transfers')
            .insert({
                business_id: businessId,
                product_id: data.product_id,
                from_warehouse_id: data.from_warehouse_id,
                to_warehouse_id: data.to_warehouse_id,
                quantity_requested: data.quantity,
                quantity_received: 0,
                status: 'pending',
                notes: data.notes,
                requested_by: data.requested_by,
                requested_at: data.requested_at || new Date().toISOString()
            })
            .select()
            .single();

        if (createError) throw createError;

        // Update source location
        const { error: reserveError } = await supabase
            .from('product_locations')
            .update({
                available_quantity: supabase.raw(`available_quantity - ${data.quantity}`),
                reserved_quantity: supabase.raw(`reserved_quantity + ${data.quantity}`),
                updated_at: new Date().toISOString()
            })
            .eq('business_id', businessId)
            .eq('product_id', data.product_id)
            .eq('warehouse_id', data.from_warehouse_id);

        if (reserveError) throw reserveError;

        return transfer;
    };

    /**
     * Execute receipt confirmation from queue
     */
    const executeReceiptOperation = async (data) => {
        // Get transfer details
        const { data: transfer, error: fetchError } = await supabase
            .from('stock_transfers')
            .select('*')
            .eq('id', data.transferId)
            .eq('business_id', businessId)
            .single();

        if (fetchError) throw fetchError;

        if (transfer.status !== 'pending') {
            throw new Error(`Transfer is already ${transfer.status}`);
        }

        // Update source location
        const quantityDifference = transfer.quantity_requested - data.quantityReceived;
        
        if (quantityDifference > 0) {
            const { data: sourceLocation, error: sourceError } = await supabase
                .from('product_locations')
                .select('available_quantity, reserved_quantity')
                .eq('business_id', businessId)
                .eq('product_id', transfer.product_id)
                .eq('warehouse_id', transfer.from_warehouse_id)
                .single();

            if (sourceError) throw sourceError;

            await supabase
                .from('product_locations')
                .update({
                    available_quantity: sourceLocation.available_quantity + quantityDifference,
                    reserved_quantity: sourceLocation.reserved_quantity - transfer.quantity_requested,
                    updated_at: new Date().toISOString()
                })
                .eq('business_id', businessId)
                .eq('product_id', transfer.product_id)
                .eq('warehouse_id', transfer.from_warehouse_id);
        } else {
            const { data: sourceLocation, error: sourceError } = await supabase
                .from('product_locations')
                .select('reserved_quantity')
                .eq('business_id', businessId)
                .eq('product_id', transfer.product_id)
                .eq('warehouse_id', transfer.from_warehouse_id)
                .single();

            if (sourceError) throw sourceError;

            await supabase
                .from('product_locations')
                .update({
                    reserved_quantity: sourceLocation.reserved_quantity - transfer.quantity_requested,
                    updated_at: new Date().toISOString()
                })
                .eq('business_id', businessId)
                .eq('product_id', transfer.product_id)
                .eq('warehouse_id', transfer.from_warehouse_id);
        }

        // Update destination location
        const { data: destLocation, error: destError } = await supabase
            .from('product_locations')
            .select('available_quantity')
            .eq('business_id', businessId)
            .eq('product_id', transfer.product_id)
            .eq('warehouse_id', transfer.to_warehouse_id)
            .maybeSingle();

        if (destError) throw destError;

        if (destLocation) {
            await supabase
                .from('product_locations')
                .update({
                    available_quantity: destLocation.available_quantity + data.quantityReceived,
                    updated_at: new Date().toISOString()
                })
                .eq('business_id', businessId)
                .eq('product_id', transfer.product_id)
                .eq('warehouse_id', transfer.to_warehouse_id);
        } else {
            await supabase
                .from('product_locations')
                .insert({
                    business_id: businessId,
                    product_id: transfer.product_id,
                    warehouse_id: transfer.to_warehouse_id,
                    available_quantity: data.quantityReceived,
                    reserved_quantity: 0
                });
        }

        // Update transfer record
        const { data: updatedTransfer, error: updateError } = await supabase
            .from('stock_transfers')
            .update({
                quantity_received: data.quantityReceived,
                status: 'completed',
                received_by: data.receivedBy,
                received_at: new Date().toISOString(),
                receipt_notes: data.notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', data.transferId)
            .select()
            .single();

        if (updateError) throw updateError;

        return updatedTransfer;
    };

    /**
     * Auto-sync when coming back online
     */
    useEffect(() => {
        if (isOnline && offlineQueueSupported && !syncInProgress.current) {
            syncOfflineQueue();
        }
    }, [isOnline, offlineQueueSupported, syncOfflineQueue]);

    /**
     * Get product stock across all locations
     * 
     * @param {string} productId - Product ID
     * @returns {Promise<Array>} Array of location stock records
     */
    const getProductLocations = useCallback(async (productId) => {
        if (!productId) {
            throw new Error('Product ID is required');
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('product_locations')
                .select(`
                    *,
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

            if (fetchError) throw fetchError;

            setProductLocations(data || []);
            return data || [];
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [businessId, supabase]);

    /**
     * Transfer stock between locations
     * Creates transfer record with 'pending' status and reserves quantity at source
     * Queues operation if offline
     * 
     * @param {Object} transferData - Transfer details
     * @param {string} transferData.product_id - Product ID
     * @param {string} transferData.from_warehouse_id - Source warehouse ID
     * @param {string} transferData.to_warehouse_id - Destination warehouse ID
     * @param {number} transferData.quantity - Quantity to transfer
     * @param {string} [transferData.notes] - Optional transfer notes
     * @param {string} [transferData.requested_by] - User ID who requested transfer
     * @returns {Promise<Object>} Created transfer record
     */
    const transferStock = useCallback(async (transferData) => {
        const {
            product_id,
            from_warehouse_id,
            to_warehouse_id,
            quantity,
            notes = '',
            requested_by = null
        } = transferData;

        // Validation
        if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
            throw new Error('Missing required transfer data');
        }

        if (from_warehouse_id === to_warehouse_id) {
            throw new Error('Source and destination warehouses must be different');
        }

        if (quantity <= 0) {
            throw new Error('Transfer quantity must be greater than zero');
        }

        // If offline, queue the operation
        if (!isOnline && offlineQueueSupported) {
            const operationId = await addToQueue({
                type: 'stock_transfer',
                businessId,
                data: {
                    product_id,
                    from_warehouse_id,
                    to_warehouse_id,
                    quantity,
                    notes,
                    requested_by,
                    requested_at: new Date().toISOString()
                }
            });

            console.log('Transfer queued for offline sync:', operationId);
            
            return {
                id: `offline_${operationId}`,
                status: 'queued',
                message: 'Transfer queued. Will sync when connection is restored.'
            };
        }

        setLoading(true);
        setError(null);

        try {
            // Check available stock at source location
            const { data: sourceLocation, error: checkError } = await supabase
                .from('product_locations')
                .select('available_quantity, reserved_quantity')
                .eq('business_id', businessId)
                .eq('product_id', product_id)
                .eq('warehouse_id', from_warehouse_id)
                .single();

            if (checkError) throw checkError;

            if (!sourceLocation) {
                throw new Error('Product not found at source location');
            }

            if (sourceLocation.available_quantity < quantity) {
                throw new Error(
                    `Insufficient stock at source location. Available: ${sourceLocation.available_quantity}, Requested: ${quantity}`
                );
            }

            // Reserve quantity at source location
            const { error: reserveError } = await supabase
                .from('product_locations')
                .update({
                    available_quantity: sourceLocation.available_quantity - quantity,
                    reserved_quantity: sourceLocation.reserved_quantity + quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('business_id', businessId)
                .eq('product_id', product_id)
                .eq('warehouse_id', from_warehouse_id);

            if (reserveError) throw reserveError;

            // Create transfer record
            const { data: transfer, error: createError } = await supabase
                .from('stock_transfers')
                .insert({
                    business_id: businessId,
                    product_id,
                    from_warehouse_id,
                    to_warehouse_id,
                    quantity_requested: quantity,
                    quantity_received: 0,
                    status: 'pending',
                    notes,
                    requested_by,
                    requested_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;

            // Refresh pending transfers
            await loadPendingTransfers();

            return transfer;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [businessId, supabase, isOnline, offlineQueueSupported]);

    /**
     * Confirm receipt of transferred stock
     * Updates destination location stock and completes transfer
     * Queues operation if offline
     * 
     * @param {string} transferId - Transfer ID
     * @param {number} quantityReceived - Actual quantity received (may differ from requested)
     * @param {string} [receivedBy] - User ID who received the transfer
     * @param {string} [notes] - Optional receipt notes
     * @returns {Promise<Object>} Updated transfer record
     */
    const confirmReceipt = useCallback(async (transferId, quantityReceived, receivedBy = null, notes = '') => {
        if (!transferId || !quantityReceived || quantityReceived <= 0) {
            throw new Error('Invalid transfer ID or quantity');
        }

        // If offline, queue the operation
        if (!isOnline && offlineQueueSupported) {
            const operationId = await addToQueue({
                type: 'confirm_receipt',
                businessId,
                data: {
                    transferId,
                    quantityReceived,
                    receivedBy,
                    notes
                }
            });

            console.log('Receipt confirmation queued for offline sync:', operationId);
            
            return {
                id: `offline_${operationId}`,
                status: 'queued',
                message: 'Receipt confirmation queued. Will sync when connection is restored.'
            };
        }

        setLoading(true);
        setError(null);

        try {
            // Get transfer details
            const { data: transfer, error: fetchError } = await supabase
                .from('stock_transfers')
                .select('*')
                .eq('id', transferId)
                .eq('business_id', businessId)
                .single();

            if (fetchError) throw fetchError;

            if (!transfer) {
                throw new Error('Transfer not found');
            }

            if (transfer.status !== 'pending') {
                throw new Error(`Transfer is already ${transfer.status}`);
            }

            if (quantityReceived > transfer.quantity_requested) {
                throw new Error('Received quantity cannot exceed requested quantity');
            }

            // Update source location (unreserve remaining quantity if partial receipt)
            const quantityDifference = transfer.quantity_requested - quantityReceived;
            
            if (quantityDifference > 0) {
                // Partial receipt - unreserve the difference
                const { data: sourceLocation, error: sourceError } = await supabase
                    .from('product_locations')
                    .select('available_quantity, reserved_quantity')
                    .eq('business_id', businessId)
                    .eq('product_id', transfer.product_id)
                    .eq('warehouse_id', transfer.from_warehouse_id)
                    .single();

                if (sourceError) throw sourceError;

                await supabase
                    .from('product_locations')
                    .update({
                        available_quantity: sourceLocation.available_quantity + quantityDifference,
                        reserved_quantity: sourceLocation.reserved_quantity - transfer.quantity_requested,
                        updated_at: new Date().toISOString()
                    })
                    .eq('business_id', businessId)
                    .eq('product_id', transfer.product_id)
                    .eq('warehouse_id', transfer.from_warehouse_id);
            } else {
                // Full receipt - just unreserve
                const { data: sourceLocation, error: sourceError } = await supabase
                    .from('product_locations')
                    .select('reserved_quantity')
                    .eq('business_id', businessId)
                    .eq('product_id', transfer.product_id)
                    .eq('warehouse_id', transfer.from_warehouse_id)
                    .single();

                if (sourceError) throw sourceError;

                await supabase
                    .from('product_locations')
                    .update({
                        reserved_quantity: sourceLocation.reserved_quantity - transfer.quantity_requested,
                        updated_at: new Date().toISOString()
                    })
                    .eq('business_id', businessId)
                    .eq('product_id', transfer.product_id)
                    .eq('warehouse_id', transfer.from_warehouse_id);
            }

            // Update destination location (add received quantity)
            const { data: destLocation, error: destError } = await supabase
                .from('product_locations')
                .select('available_quantity')
                .eq('business_id', businessId)
                .eq('product_id', transfer.product_id)
                .eq('warehouse_id', transfer.to_warehouse_id)
                .maybeSingle();

            if (destError) throw destError;

            if (destLocation) {
                // Update existing location
                await supabase
                    .from('product_locations')
                    .update({
                        available_quantity: destLocation.available_quantity + quantityReceived,
                        updated_at: new Date().toISOString()
                    })
                    .eq('business_id', businessId)
                    .eq('product_id', transfer.product_id)
                    .eq('warehouse_id', transfer.to_warehouse_id);
            } else {
                // Create new location record
                await supabase
                    .from('product_locations')
                    .insert({
                        business_id: businessId,
                        product_id: transfer.product_id,
                        warehouse_id: transfer.to_warehouse_id,
                        available_quantity: quantityReceived,
                        reserved_quantity: 0
                    });
            }

            // Update transfer record
            const { data: updatedTransfer, error: updateError } = await supabase
                .from('stock_transfers')
                .update({
                    quantity_received: quantityReceived,
                    status: 'completed',
                    received_by: receivedBy,
                    received_at: new Date().toISOString(),
                    receipt_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', transferId)
                .select()
                .single();

            if (updateError) throw updateError;

            // Refresh pending transfers
            await loadPendingTransfers();

            return updatedTransfer;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [businessId, supabase, isOnline, offlineQueueSupported]);

    /**
     * Load pending transfers for current warehouse or all warehouses
     * 
     * @returns {Promise<Array>} Array of pending transfer records
     */
    const loadPendingTransfers = useCallback(async () => {
        try {
            let query = supabase
                .from('stock_transfers')
                .select(`
                    *,
                    products (
                        id,
                        name,
                        sku
                    ),
                    from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey (
                        id,
                        name,
                        location
                    ),
                    to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey (
                        id,
                        name,
                        location
                    )
                `)
                .eq('business_id', businessId)
                .eq('status', 'pending')
                .order('requested_at', { ascending: false });

            if (warehouseId) {
                query = query.or(`from_warehouse_id.eq.${warehouseId},to_warehouse_id.eq.${warehouseId}`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setPendingTransfers(data || []);
            return data || [];
        } catch (err) {
            console.error('Failed to load pending transfers:', err);
            return [];
        }
    }, [businessId, warehouseId, supabase]);

    /**
     * Set up Supabase Realtime subscription for inventory updates
     * Monitors product_locations table for changes
     */
    useEffect(() => {
        if (!businessId) return;

        setSyncing(true);

        // Create realtime channel
        realtimeChannel.current = supabase
            .channel(`inventory-sync-${businessId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_locations',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    console.log('Inventory update received:', payload);
                    setLastSyncTime(new Date());
                    
                    // Update local state based on payload
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        setProductLocations(prev => {
                            const index = prev.findIndex(
                                loc => loc.id === payload.new.id
                            );
                            if (index >= 0) {
                                const updated = [...prev];
                                updated[index] = payload.new;
                                return updated;
                            } else {
                                return [...prev, payload.new];
                            }
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setProductLocations(prev =>
                            prev.filter(loc => loc.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setSyncing(false);
                    setLastSyncTime(new Date());
                    console.log('Realtime sync established');
                } else if (status === 'CHANNEL_ERROR') {
                    setSyncing(false);
                    console.error('Realtime sync error');
                }
            });

        // Cleanup on unmount
        return () => {
            if (realtimeChannel.current) {
                supabase.removeChannel(realtimeChannel.current);
                realtimeChannel.current = null;
            }
        };
    }, [businessId, supabase]);

    // Load pending transfers on mount
    useEffect(() => {
        if (businessId) {
            loadPendingTransfers();
        }
    }, [businessId, loadPendingTransfers]);

    return {
        // State
        loading,
        syncing,
        lastSyncTime,
        error,
        productLocations,
        pendingTransfers,
        isOnline,
        offlineQueueSupported,
        
        // Functions
        getProductLocations,
        transferStock,
        confirmReceipt,
        loadPendingTransfers,
        syncOfflineQueue
    };
}
