/**
 * Unit Tests for Offline Queue with IndexedDB
 * 
 * Tests core functionality of the offline queue system
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
    initDB,
    addToQueue,
    getPendingOperations,
    getOperation,
    updateOperationStatus,
    removeFromQueue,
    clearCompletedOperations,
    getQueueStats,
    addConflict,
    getUnresolvedConflicts,
    resolveConflict,
    isIndexedDBSupported,
    clearAllData
} from '../offlineQueue';

// Mock IndexedDB for testing
const setupIndexedDBMock = () => {
    if (typeof indexedDB === 'undefined') {
        const fakeIndexedDB = require('fake-indexeddb');
        const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
        
        global.indexedDB = fakeIndexedDB;
        global.IDBKeyRange = FDBKeyRange;
        
        // Add deleteDatabase if not present
        if (!global.indexedDB.deleteDatabase) {
            global.indexedDB.deleteDatabase = (name) => {
                const request = {
                    onsuccess: null,
                    onerror: null,
                    result: undefined,
                    error: null
                };
                
                setTimeout(() => {
                    if (request.onsuccess) {
                        request.onsuccess({ target: request });
                    }
                }, 0);
                
                return request;
            };
        }
    }
};

describe('Offline Queue', () => {
    beforeAll(() => {
        setupIndexedDBMock();
    });

    beforeEach(async () => {
        // Clear database before each test
        await clearAllData();
    });

    afterAll(async () => {
        await clearAllData();
    });

    describe('IndexedDB Support', () => {
        test('should detect IndexedDB support', () => {
            expect(isIndexedDBSupported()).toBe(true);
        });
    });

    describe('Database Initialization', () => {
        test('should initialize database successfully', async () => {
            const db = await initDB();
            expect(db).toBeDefined();
            expect(db.objectStoreNames.contains('operations')).toBe(true);
            expect(db.objectStoreNames.contains('conflicts')).toBe(true);
        });
    });

    describe('Queue Operations', () => {
        test('should add operation to queue', async () => {
            const operation = {
                type: 'stock_transfer',
                businessId: 'test-business-123',
                data: {
                    product_id: 'prod-1',
                    from_warehouse_id: 'wh-1',
                    to_warehouse_id: 'wh-2',
                    quantity: 10
                }
            };

            const operationId = await addToQueue(operation);
            expect(operationId).toBeDefined();
            expect(typeof operationId).toBe('number');
        });

        test('should retrieve pending operations', async () => {
            const operation1 = {
                type: 'stock_transfer',
                businessId: 'test-business-123',
                data: { quantity: 10 }
            };

            const operation2 = {
                type: 'confirm_receipt',
                businessId: 'test-business-123',
                data: { transferId: 'transfer-1' }
            };

            await addToQueue(operation1);
            await addToQueue(operation2);

            const pending = await getPendingOperations();
            expect(pending).toHaveLength(2);
            expect(pending[0].status).toBe('pending');
            expect(pending[1].status).toBe('pending');
        });

        test('should get operation by ID', async () => {
            const operation = {
                type: 'stock_transfer',
                businessId: 'test-business-123',
                data: { quantity: 10 }
            };

            const operationId = await addToQueue(operation);
            const retrieved = await getOperation(operationId);

            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(operationId);
            expect(retrieved.type).toBe('stock_transfer');
            expect(retrieved.data.quantity).toBe(10);
        });

        test('should update operation status', async () => {
            const operation = {
                type: 'stock_transfer',
                businessId: 'test-business-123',
                data: { quantity: 10 }
            };

            const operationId = await addToQueue(operation);
            await updateOperationStatus(operationId, 'completed');

            const updated = await getOperation(operationId);
            expect(updated.status).toBe('completed');
        });

        test('should remove operation from queue', async () => {
            const operation = {
                type: 'stock_transfer',
                businessId: 'test-business-123',
                data: { quantity: 10 }
            };

            const operationId = await addToQueue(operation);
            await removeFromQueue(operationId);

            const retrieved = await getOperation(operationId);
            expect(retrieved).toBeUndefined();
        });

        test('should clear completed operations', async () => {
            const op1 = await addToQueue({ type: 'test1', businessId: 'b1', data: {} });
            const op2 = await addToQueue({ type: 'test2', businessId: 'b1', data: {} });
            const op3 = await addToQueue({ type: 'test3', businessId: 'b1', data: {} });

            await updateOperationStatus(op1, 'completed');
            await updateOperationStatus(op2, 'completed');
            await updateOperationStatus(op3, 'pending');

            const cleared = await clearCompletedOperations();
            expect(cleared).toBe(2);

            const remaining = await getPendingOperations();
            expect(remaining).toHaveLength(1);
        });
    });

    describe('Queue Statistics', () => {
        test('should get queue statistics', async () => {
            await addToQueue({ type: 'test1', businessId: 'b1', data: {} });
            await addToQueue({ type: 'test2', businessId: 'b1', data: {} });
            const op3 = await addToQueue({ type: 'test3', businessId: 'b1', data: {} });
            
            await updateOperationStatus(op3, 'completed');

            const stats = await getQueueStats();
            expect(stats.total).toBe(3);
            expect(stats.pending).toBe(2);
            expect(stats.completed).toBe(1);
            expect(stats.failed).toBe(0);
            expect(stats.oldestPending).toBeDefined();
        });
    });

    describe('Conflict Management', () => {
        test('should add conflict', async () => {
            const conflict = {
                operationId: 1,
                type: 'stock_transfer',
                localData: { quantity: 10 },
                serverData: { quantity: 8 },
                error: 'Concurrent update detected'
            };

            const conflictId = await addConflict(conflict);
            expect(conflictId).toBeDefined();
            expect(typeof conflictId).toBe('number');
        });

        test('should get unresolved conflicts', async () => {
            const conflict1 = {
                operationId: 1,
                type: 'stock_transfer',
                localData: {},
                serverData: {},
                error: 'Conflict 1'
            };

            const conflict2 = {
                operationId: 2,
                type: 'confirm_receipt',
                localData: {},
                serverData: {},
                error: 'Conflict 2'
            };

            await addConflict(conflict1);
            await addConflict(conflict2);

            const unresolved = await getUnresolvedConflicts();
            expect(unresolved).toHaveLength(2);
            expect(unresolved[0].resolved).toBe(false);
            expect(unresolved[1].resolved).toBe(false);
        });

        test('should resolve conflict', async () => {
            const conflict = {
                operationId: 1,
                type: 'stock_transfer',
                localData: { quantity: 10 },
                serverData: { quantity: 8 },
                error: 'Conflict'
            };

            const conflictId = await addConflict(conflict);
            await resolveConflict(conflictId, 'keep_local');

            const unresolved = await getUnresolvedConflicts();
            expect(unresolved).toHaveLength(0);
        });
    });

    describe('Operation Retry Logic', () => {
        test('should track retry count', async () => {
            const operation = {
                type: 'stock_transfer',
                businessId: 'test-business-123',
                data: { quantity: 10 }
            };

            const operationId = await addToQueue(operation);
            
            await updateOperationStatus(operationId, 'pending', {
                retryCount: 1,
                lastRetry: new Date().toISOString(),
                error: 'Network error'
            });

            const updated = await getOperation(operationId);
            expect(updated.retryCount).toBe(1);
            expect(updated.error).toBe('Network error');
        });
    });
});
