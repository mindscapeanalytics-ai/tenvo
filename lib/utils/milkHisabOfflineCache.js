/**
 * Route Hisab offline day/period snapshots (IndexedDB).
 */
import {
  openMilkHisabOfflineDb,
  milkHisabDaySnapshotKey,
  milkHisabPeriodSnapshotKey,
} from '@/lib/utils/milkHisabOfflineDb';

const DAY_STORE = 'daySnapshots';
const PERIOD_STORE = 'periodSnapshots';

/** Snapshots older than this are treated as stale for offline open. */
export const MILK_HISAB_SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {string} businessId
 * @param {string} deliveryDate YYYY-MM-DD
 * @param {{ products: object[], rows: object[], kpis?: object|null }} data
 */
export async function writeMilkHisabDaySnapshot(businessId, deliveryDate, data) {
  if (!businessId || !deliveryDate) return false;
  const db = await openMilkHisabOfflineDb();
  const record = {
    id: milkHisabDaySnapshotKey(businessId, deliveryDate),
    businessId,
    deliveryDate,
    products: data.products || [],
    rows: data.rows || [],
    kpis: data.kpis || null,
    savedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAY_STORE, 'readwrite');
    tx.objectStore(DAY_STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * @param {string} businessId
 * @param {string} deliveryDate
 */
export async function readMilkHisabDaySnapshot(businessId, deliveryDate) {
  if (!businessId || !deliveryDate) return null;
  const db = await openMilkHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAY_STORE, 'readonly');
    const req = tx.objectStore(DAY_STORE).get(milkHisabDaySnapshotKey(businessId, deliveryDate));
    req.onsuccess = () => {
      const row = req.result || null;
      if (!row) {
        resolve(null);
        return;
      }
      const age = Date.now() - new Date(row.savedAt || 0).getTime();
      if (!Number.isFinite(age) || age > MILK_HISAB_SNAPSHOT_TTL_MS) {
        resolve(null);
        return;
      }
      resolve(row);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * @param {string} businessId
 * @param {string} period
 * @param {object} data
 */
export async function writeMilkHisabPeriodSnapshot(businessId, period, data) {
  if (!businessId || !period) return false;
  const db = await openMilkHisabOfflineDb();
  const record = {
    id: milkHisabPeriodSnapshotKey(businessId, period),
    businessId,
    period,
    rows: data.rows || [],
    productColumns: data.productColumns || [],
    label: data.label || period,
    kpis: data.kpis || null,
    savedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PERIOD_STORE, 'readwrite');
    tx.objectStore(PERIOD_STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * @param {string} businessId
 * @param {string} period
 */
export async function readMilkHisabPeriodSnapshot(businessId, period) {
  if (!businessId || !period) return null;
  const db = await openMilkHisabOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PERIOD_STORE, 'readonly');
    const req = tx.objectStore(PERIOD_STORE).get(milkHisabPeriodSnapshotKey(businessId, period));
    req.onsuccess = () => {
      const row = req.result || null;
      if (!row) {
        resolve(null);
        return;
      }
      const age = Date.now() - new Date(row.savedAt || 0).getTime();
      if (!Number.isFinite(age) || age > MILK_HISAB_SNAPSHOT_TTL_MS) {
        resolve(null);
        return;
      }
      resolve(row);
    };
    req.onerror = () => reject(req.error);
  });
}

export function isMilkHisabOfflineSnapshotFresh(savedAt) {
  const age = Date.now() - new Date(savedAt || 0).getTime();
  return Number.isFinite(age) && age >= 0 && age <= MILK_HISAB_SNAPSHOT_TTL_MS;
}
