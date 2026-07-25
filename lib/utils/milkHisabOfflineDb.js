/**
 * IndexedDB for milk Route Hisab offline snapshot + save queue.
 * Separate from POS DB (tenvo_pos_offline).
 */

export const MILK_HISAB_OFFLINE_DB_NAME = 'tenvo_milk_hisab_offline';
export const MILK_HISAB_OFFLINE_DB_VERSION = 1;

export function openMilkHisabOfflineDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MILK_HISAB_OFFLINE_DB_NAME, MILK_HISAB_OFFLINE_DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('daySnapshots')) {
        db.createObjectStore('daySnapshots', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('periodSnapshots')) {
        db.createObjectStore('periodSnapshots', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('daySaves')) {
        const os = db.createObjectStore('daySaves', { keyPath: 'id', autoIncrement: true });
        os.createIndex('businessId', 'businessId', { unique: false });
        os.createIndex('businessDate', 'businessDate', { unique: false });
        os.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

export function milkHisabDaySnapshotKey(businessId, deliveryDate) {
  return `${businessId}::${deliveryDate}`;
}

export function milkHisabPeriodSnapshotKey(businessId, period) {
  return `${businessId}::${period}`;
}

export function milkHisabBusinessDateKey(businessId, deliveryDate) {
  return `${businessId}::${deliveryDate}`;
}
