/**
 * Offline Route Hisab day-save queue.
 * Coalesces to one pending row per (businessId, deliveryDate) — last write wins.
 */
import {
  openMilkHisabOfflineDb,
  milkHisabBusinessDateKey,
} from '@/lib/utils/milkHisabOfflineDb';

const STORE = 'daySaves';

/**
 * @param {{
 *   businessId: string,
 *   deliveryDate: string,
 *   category: string,
 *   rows: object[],
 *   clientRef: string,
 * }} save
 */
export async function enqueueMilkHisabDaySave(save) {
  const businessId = save?.businessId;
  const deliveryDate = save?.deliveryDate;
  const clientRef = save?.clientRef;
  if (!businessId || !deliveryDate) {
    throw new Error('businessId and deliveryDate required for offline hisab save');
  }
  if (!clientRef || typeof clientRef !== 'string') {
    throw new Error('clientRef required for offline hisab save');
  }

  const businessDate = milkHisabBusinessDateKey(businessId, deliveryDate);
  const db = await openMilkHisabOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const idx = store.index('businessDate');
    const getAll = idx.getAll(businessDate);

    getAll.onsuccess = () => {
      const existing = (getAll.result || []).filter((r) => r.status === 'pending');
      for (const row of existing) {
        row.status = 'superseded';
        row.supersededAt = new Date().toISOString();
        store.put(row);
      }
      const record = {
        businessId,
        deliveryDate,
        businessDate,
        clientRef,
        category: save.category,
        payload: {
          businessId,
          category: save.category,
          deliveryDate,
          rows: save.rows || [],
          clientRef,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        attempts: 0,
      };
      const addReq = store.add(record);
      addReq.onsuccess = () => resolve(addReq.result);
      addReq.onerror = () => reject(addReq.error);
    };
    getAll.onerror = () => reject(getAll.error);
  });
}

export async function listPendingMilkHisabDaySaves(businessId) {
  const db = await openMilkHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('businessId');
    const req = idx.getAll(businessId);
    req.onsuccess = () => {
      const rows = (req.result || []).filter((r) => r.status === 'pending');
      rows.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function countPendingMilkHisabDaySaves(businessId) {
  const rows = await listPendingMilkHisabDaySaves(businessId);
  return rows.length;
}

export async function markMilkHisabDaySaveSynced(id) {
  const db = await openMilkHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (!row) {
        resolve(false);
        return;
      }
      row.status = 'synced';
      row.syncedAt = new Date().toISOString();
      store.put(row);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function incrementMilkHisabDaySaveAttempt(id, error) {
  const db = await openMilkHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (!row) {
        resolve(false);
        return;
      }
      row.attempts = (row.attempts || 0) + 1;
      row.lastError = String(error || '').slice(0, 500);
      store.put(row);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function markMilkHisabDaySaveFailed(id, error) {
  const db = await openMilkHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (!row) {
        resolve(false);
        return;
      }
      row.status = 'failed';
      row.lastError = String(error || '').slice(0, 500);
      row.failedAt = new Date().toISOString();
      store.put(row);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export function newMilkHisabClientRef() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mh-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
