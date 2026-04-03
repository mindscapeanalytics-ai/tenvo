/**
 * Offline Queue with IndexedDB
 * 
 * Provides offline-first capabilities for inventory operations
 * Queues stock movements when offline and syncs when connection restored
 * 
 * Features:
 * - IndexedDB storage for offline operations
 * - Automatic sync when connection restored
 * - Conflict resolution for concurrent updates
 * - Operation retry with exponential backoff
 * 
 * Database Schema:
 * - Store: 'operations' - Queued operations
 * - Store: 'conflicts' - Detected conflicts requiring resolution
 */

const DB_NAME = 'inventory_offline_queue';
const DB_VERSION = 1;
const OPERATIONS_STORE = 'operations';
const CONFLICTS_STORE = 'conflicts';

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Operations store
      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        const operationsStore = db.createObjectStore(OPERATIONS_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        operationsStore.createIndex('type', 'type', { unique: false });
        operationsStore.createIndex('status', 'status', { unique: false });
      }

      // Conflicts store
      if (!db.objectStoreNames.contains(CONFLICTS_STORE)) {
        const conflictsStore = db.createObjectStore(CONFLICTS_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        conflictsStore.createIndex('timestamp', 'timestamp', { unique: false });
        conflictsStore.createIndex('resolved', 'resolved', { unique: false });
      }
    };
  });
}

/**
 * Add operation to offline queue
 * @param {Object} operation - Operation details
 * @param {string} operation.type - Operation type (stock_transfer, stock_adjustment, batch_update, etc.)
 * @param {Object} operation.data - Operation data
 * @param {string} operation.businessId - Business ID
 * @returns {Promise<number>} Operation ID
 */
export async function addToQueue(operation) {
  const db = await initDB();
  
  const queuedOperation = {
    ...operation,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    lastRetry: null,
    error: null
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const request = store.add(queuedOperation);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending operations from queue
 * @returns {Promise<Array>} Array of pending operations
 */
export async function getPendingOperations() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readonly');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get operation by ID
 * @param {number} id - Operation ID
 * @returns {Promise<Object>} Operation
 */
export async function getOperation(id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readonly');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update operation status
 * @param {number} id - Operation ID
 * @param {string} status - New status (pending, syncing, completed, failed)
 * @param {Object} [updates] - Additional fields to update
 * @returns {Promise<void>}
 */
export async function updateOperationStatus(id, status, updates = {}) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const operation = getRequest.result;
      if (!operation) {
        reject(new Error('Operation not found'));
        return;
      }

      const updatedOperation = {
        ...operation,
        status,
        ...updates
      };

      const putRequest = store.put(updatedOperation);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Remove operation from queue
 * @param {number} id - Operation ID
 * @returns {Promise<void>}
 */
export async function removeFromQueue(id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all completed operations from queue
 * @returns {Promise<number>} Number of operations cleared
 */
export async function clearCompletedOperations() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('completed'));
    
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        count++;
        cursor.continue();
      } else {
        resolve(count);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get queue statistics
 * @returns {Promise<Object>} Queue stats
 */
export async function getQueueStats() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OPERATIONS_STORE], 'readonly');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const operations = request.result;
      const stats = {
        total: operations.length,
        pending: operations.filter(op => op.status === 'pending').length,
        syncing: operations.filter(op => op.status === 'syncing').length,
        completed: operations.filter(op => op.status === 'completed').length,
        failed: operations.filter(op => op.status === 'failed').length,
        oldestPending: operations
          .filter(op => op.status === 'pending')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]
      };
      resolve(stats);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Add conflict to conflicts store
 * @param {Object} conflict - Conflict details
 * @returns {Promise<number>} Conflict ID
 */
export async function addConflict(conflict) {
  const db = await initDB();

  const conflictRecord = {
    ...conflict,
    timestamp: new Date().toISOString(),
    resolved: false,
    resolution: null
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFLICTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONFLICTS_STORE);
    const request = store.add(conflictRecord);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get unresolved conflicts
 * @returns {Promise<Array>} Array of unresolved conflicts
 */
export async function getUnresolvedConflicts() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFLICTS_STORE], 'readonly');
    const store = transaction.objectStore(CONFLICTS_STORE);
    const index = store.index('resolved');
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Resolve conflict
 * @param {number} id - Conflict ID
 * @param {string} resolution - Resolution strategy (keep_local, keep_server, merge)
 * @param {Object} [resolvedData] - Resolved data if merge strategy
 * @returns {Promise<void>}
 */
export async function resolveConflict(id, resolution, resolvedData = null) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONFLICTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONFLICTS_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const conflict = getRequest.result;
      if (!conflict) {
        reject(new Error('Conflict not found'));
        return;
      }

      const updatedConflict = {
        ...conflict,
        resolved: true,
        resolution,
        resolvedData,
        resolvedAt: new Date().toISOString()
      };

      const putRequest = store.put(updatedConflict);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Check if browser supports IndexedDB
 * @returns {boolean}
 */
export function isIndexedDBSupported() {
  return typeof indexedDB !== 'undefined';
}

/**
 * Clear all data from IndexedDB (for testing/debugging)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
