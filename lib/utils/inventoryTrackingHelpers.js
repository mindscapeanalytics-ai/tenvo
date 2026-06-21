/**
 * Shared batch/serial heuristics for grid saves and composite upsert.
 * Placeholder rows must not flip a product into batch-tracked mode or override headline stock.
 */

export function isMeaningfulInventoryBatch(batch) {
  if (!batch || typeof batch !== 'object') return false;
  const q = Number(batch.quantity);
  if (Number.isFinite(q) && q !== 0) return true;
  const bn = batch.batch_number ?? batch.batchNumber;
  return bn != null && String(bn).trim() !== '';
}

export function isMeaningfulInventorySerial(serial) {
  if (serial == null) return false;
  if (typeof serial === 'string') return String(serial).trim() !== '';
  if (typeof serial === 'object') {
    const sn = serial.serial_number ?? serial.serialNumber;
    return sn != null && String(sn).trim() !== '';
  }
  return false;
}

export function filterMeaningfulBatches(batches) {
  if (!Array.isArray(batches)) return [];
  return batches.filter(isMeaningfulInventoryBatch);
}

export function filterMeaningfulSerials(serials) {
  if (!Array.isArray(serials)) return [];
  return serials.filter(isMeaningfulInventorySerial);
}

export function hasMeaningfulBatchOrSerialTracking(batches, serials) {
  return (
    filterMeaningfulBatches(batches).length > 0 ||
    filterMeaningfulSerials(serials).length > 0
  );
}
