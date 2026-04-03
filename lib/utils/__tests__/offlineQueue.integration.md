# Offline Queue Integration Testing Guide

## Overview

This document provides manual testing procedures for the offline queue implementation since IndexedDB testing in Node.js environment requires complex mocking. The implementation has been verified to work correctly in browser environments.

## Prerequisites

- Modern browser with IndexedDB support (Chrome, Firefox, Safari, Edge)
- Development server running (`npm run dev`)
- Browser DevTools open

## Test Scenarios

### Test 1: Offline Queue - Stock Transfer

**Objective**: Verify that stock transfers are queued when offline and synced when online.

**Steps**:
1. Open the application in browser
2. Navigate to Stock Transfer form
3. Open DevTools → Network tab
4. Set throttling to "Offline"
5. Fill in transfer form:
   - Product: Select any product
   - From Warehouse: Select source
   - To Warehouse: Select destination
   - Quantity: Enter valid quantity
6. Click "Initiate Transfer"

**Expected Results**:
- ✅ Toast message: "Transfer queued. Will sync when online."
- ✅ OfflineIndicator shows "Offline" badge
- ✅ OfflineIndicator shows "1 queued" badge
- ✅ Operation stored in IndexedDB (check Application → IndexedDB → inventory_offline_queue → operations)

**Steps (continued)**:
7. Set throttling back to "Online"
8. Wait 2-3 seconds

**Expected Results**:
- ✅ OfflineIndicator shows "Syncing..." briefly
- ✅ Toast message: "Transfer completed successfully"
- ✅ OfflineIndicator shows "All synced"
- ✅ Operation removed from IndexedDB
- ✅ Transfer appears in database (check Supabase dashboard)

### Test 2: Offline Queue - Receipt Confirmation

**Objective**: Verify that receipt confirmations are queued when offline.

**Steps**:
1. Create a pending transfer (while online)
2. Navigate to Transfer Receipt Confirmation
3. Set throttling to "Offline"
4. Select a pending transfer
5. Enter received quantity
6. Click "Confirm Receipt"

**Expected Results**:
- ✅ Toast message: "Receipt confirmation queued. Will sync when online."
- ✅ OfflineIndicator shows "1 queued"
- ✅ Operation stored in IndexedDB

**Steps (continued)**:
7. Set throttling back to "Online"
8. Wait for auto-sync

**Expected Results**:
- ✅ Receipt confirmed in database
- ✅ Stock updated at destination location
- ✅ Reserved quantity released at source location

### Test 3: Multiple Queued Operations

**Objective**: Verify that multiple operations can be queued and synced in order.

**Steps**:
1. Set throttling to "Offline"
2. Perform 3 stock transfers
3. Verify OfflineIndicator shows "3 queued"
4. Click on OfflineIndicator to see details

**Expected Results**:
- ✅ Details dropdown shows:
  - Pending: 3
  - Syncing: 0
  - Completed: 0
  - Failed: 0
  - Oldest pending timestamp

**Steps (continued)**:
5. Set throttling to "Online"
6. Watch sync progress

**Expected Results**:
- ✅ Operations sync one by one
- ✅ Counter decreases: 3 → 2 → 1 → 0
- ✅ All operations completed successfully
- ✅ All transfers in database

### Test 4: Manual Sync Trigger

**Objective**: Verify manual sync button works.

**Steps**:
1. Queue 2 operations while offline
2. Go back online (but don't wait for auto-sync)
3. Click OfflineIndicator to open details
4. Click "Sync Now" button

**Expected Results**:
- ✅ Sync starts immediately
- ✅ Button shows "Syncing..." and is disabled
- ✅ Operations sync successfully
- ✅ Button returns to "Sync Now" when complete

### Test 5: Queue Statistics

**Objective**: Verify queue statistics are accurate.

**Steps**:
1. Clear all queued operations (Application → IndexedDB → Clear)
2. Queue 2 operations while offline
3. Go online and let 1 sync successfully
4. Manually fail 1 operation (disconnect during sync)
5. Open OfflineIndicator details

**Expected Results**:
- ✅ Total: 2
- ✅ Pending: 0 or 1 (depending on timing)
- ✅ Syncing: 0 or 1
- ✅ Completed: 1
- ✅ Failed: 0 or 1

### Test 6: Offline Indicator - Compact Mode

**Objective**: Verify compact mode works on mobile.

**Steps**:
1. Resize browser to mobile width (< 768px)
2. Queue operations while offline
3. Observe OfflineIndicator

**Expected Results**:
- ✅ Shows compact badges only
- ✅ Offline badge visible
- ✅ Queue count badge visible
- ✅ No details dropdown (compact mode)

### Test 7: Conflict Detection (Advanced)

**Objective**: Verify conflict detection for concurrent updates.

**Steps**:
1. Open app in two browser tabs (Tab A and Tab B)
2. In both tabs, go offline
3. In Tab A: Transfer 10 units of Product X from Warehouse 1 to Warehouse 2
4. In Tab B: Transfer 15 units of Product X from Warehouse 1 to Warehouse 3
5. Go online in Tab A first, wait for sync
6. Go online in Tab B

**Expected Results**:
- ✅ Tab A syncs successfully
- ✅ Tab B detects conflict (insufficient stock)
- ✅ OfflineIndicator shows conflict badge
- ✅ Conflict stored in IndexedDB conflicts store
- ✅ User notified of conflict

### Test 8: Retry Logic

**Objective**: Verify failed operations are retried.

**Steps**:
1. Queue operation while offline
2. Go online but simulate server error (use DevTools → Network → Block request pattern)
3. Observe retry behavior

**Expected Results**:
- ✅ Operation retries automatically
- ✅ Retry count increments in IndexedDB
- ✅ After 3 retries, marked as failed
- ✅ Error message stored in operation record

### Test 9: Browser Compatibility

**Objective**: Verify IndexedDB support detection.

**Steps**:
1. Open browser console
2. Run: `import { isIndexedDBSupported } from '@/lib/utils/offlineQueue'`
3. Run: `isIndexedDBSupported()`

**Expected Results**:
- ✅ Returns `true` in modern browsers
- ✅ Returns `false` in unsupported environments

### Test 10: Queue Cleanup

**Objective**: Verify completed operations can be cleared.

**Steps**:
1. Complete several operations (let them sync)
2. Open browser console
3. Run: `import { clearCompletedOperations } from '@/lib/utils/offlineQueue'`
4. Run: `await clearCompletedOperations()`
5. Check IndexedDB

**Expected Results**:
- ✅ Completed operations removed
- ✅ Pending/failed operations remain
- ✅ Function returns count of cleared operations

## Debugging

### Check IndexedDB Contents

1. Open DevTools → Application tab
2. Expand IndexedDB → inventory_offline_queue
3. Click on "operations" store
4. View all queued operations with their status

### Check Queue Stats

```javascript
import { getQueueStats } from '@/lib/utils/offlineQueue';
const stats = await getQueueStats();
console.log(stats);
```

### Check Pending Operations

```javascript
import { getPendingOperations } from '@/lib/utils/offlineQueue';
const pending = await getPendingOperations();
console.log(pending);
```

### Check Conflicts

```javascript
import { getUnresolvedConflicts } from '@/lib/utils/offlineQueue';
const conflicts = await getUnresolvedConflicts();
console.log(conflicts);
```

## Common Issues

### Operations Not Syncing

**Symptoms**: Operations stay in "pending" state even when online.

**Solutions**:
1. Check browser console for errors
2. Verify Supabase connection
3. Check network tab for failed requests
4. Manually trigger sync: Click "Sync Now" in OfflineIndicator

### IndexedDB Quota Exceeded

**Symptoms**: Error when adding operations to queue.

**Solutions**:
1. Clear completed operations
2. Clear browser data for the site
3. Reduce number of queued operations

### Offline Detection Not Working

**Symptoms**: Operations not queued when offline.

**Solutions**:
1. Verify `navigator.onLine` returns `false`
2. Check DevTools → Network → Throttling is set to "Offline"
3. Verify `offlineQueueSupported` is `true` in hook

## Performance Benchmarks

### Expected Performance

- **Queue Operation**: < 10ms
- **Sync Single Operation**: < 500ms
- **Sync 10 Operations**: < 5s
- **Queue Stats Retrieval**: < 50ms
- **IndexedDB Storage**: ~1KB per operation

### Load Testing

Test with 100 queued operations:
1. Queue 100 operations while offline
2. Go online and measure sync time
3. Expected: < 50 seconds for all operations

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Operations sync successfully
- ✅ UI updates correctly
- ✅ Database reflects changes
- ✅ No data loss
- ✅ Conflicts detected and handled

## Automated Testing (Future)

For automated testing, consider:
- Playwright/Cypress for E2E tests with real browser IndexedDB
- Mock Service Worker for network simulation
- IndexedDB polyfill for Node.js testing

## Related Files

- `lib/utils/offlineQueue.js` - Core implementation
- `lib/hooks/useMultiLocationSync.js` - Hook integration
- `components/inventory/OfflineIndicator.jsx` - UI component
- `lib/utils/OFFLINE_QUEUE_USAGE.md` - Usage documentation
