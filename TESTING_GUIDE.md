# Dashboard Consolidation - Testing Guide

## Quick Start

### Enable Feature Flag (Development)

1. Create or update `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_UNIFIED_DASHBOARD=true
```

2. Restart your development server:
```bash
npm run dev
# or
yarn dev
```

3. Navigate to your dashboard and verify role-based template loads

### Disable Feature Flag (Rollback)

1. Update `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_UNIFIED_DASHBOARD=false
```

2. Restart server - dashboard returns to current behavior

## Testing Checklist

### Phase 0: Role-Based Dashboards

#### Test 1: Feature Flag Disabled (Default)
- [ ] Dashboard loads normally
- [ ] No console errors
- [ ] Current dashboard behavior maintained
- [ ] All widgets visible
- [ ] No performance degradation

#### Test 2: Feature Flag Enabled - Owner Role
- [ ] OwnerDashboard template loads
- [ ] All widgets visible (full permissions)
- [ ] System health widget present
- [ ] Audit trail accessible
- [ ] No console errors
- [ ] Load time <2 seconds

#### Test 3: Feature Flag Enabled - Manager Role
- [ ] ManagerDashboard template loads
- [ ] Approval queue prominent
- [ ] Team productivity widget visible
- [ ] Limited financial access
- [ ] No console errors
- [ ] Load time <2 seconds

#### Test 4: Feature Flag Enabled - Sales Role
- [ ] SalesDashboard template loads
- [ ] Quick invoice creation visible
- [ ] Today's sales widget prominent
- [ ] Commission tracking visible
- [ ] Limited inventory access
- [ ] No console errors
- [ ] Load time <2 seconds

#### Test 5: Feature Flag Enabled - Inventory Role
- [ ] InventoryDashboard template loads
- [ ] Stock management focus
- [ ] Reorder alerts prominent
- [ ] Cycle count tasks visible
- [ ] Limited financial access
- [ ] No console errors
- [ ] Load time <2 seconds

#### Test 6: Feature Flag Enabled - Accountant Role
- [ ] AccountantDashboard template loads
- [ ] Financial metrics prominent
- [ ] Tax calculations visible
- [ ] FBR compliance widget present
- [ ] Limited operational access
- [ ] No console errors
- [ ] Load time <2 seconds

### Domain-Specific Testing

#### Pharmacy Domain
- [ ] Drug expiry calendar visible (if role permits)
- [ ] FBR compliance widget present
- [ ] Controlled substances tracking
- [ ] Batch tracking enabled

#### Textile Domain
- [ ] Roll/bale inventory visible
- [ ] Fabric type distribution
- [ ] Market-wise sales
- [ ] Finish status tracking

#### Electronics Domain
- [ ] Serial tracking enabled
- [ ] Warranty calendar visible
- [ ] Brand performance metrics
- [ ] Return/repair rate tracking

#### Garments Domain
- [ ] Size-color matrix visible
- [ ] Lot inventory tracking
- [ ] Seasonal collections
- [ ] Style trends analysis

#### Retail Domain
- [ ] Category performance visible
- [ ] Fast/slow moving items
- [ ] Margin analysis
- [ ] Customer loyalty metrics

### Permission Testing

#### Owner Permissions
- [ ] Can see all widgets
- [ ] Can access all features
- [ ] Can manage users
- [ ] Can view financials
- [ ] Can manage settings

#### Manager Permissions
- [ ] Can approve requests
- [ ] Can view team metrics
- [ ] Can view financials
- [ ] Cannot manage users
- [ ] Cannot manage settings

#### Sales Permissions
- [ ] Can create invoices
- [ ] Can view customers
- [ ] Can view commission
- [ ] Cannot view full financials
- [ ] Cannot manage inventory

#### Inventory Permissions
- [ ] Can manage stock
- [ ] Can view reorder alerts
- [ ] Can perform cycle counts
- [ ] Cannot view financials
- [ ] Cannot create invoices

#### Accountant Permissions
- [ ] Can view financials
- [ ] Can manage expenses
- [ ] Can view tax reports
- [ ] Cannot manage inventory
- [ ] Cannot manage users

### Performance Testing

#### Load Time
- [ ] Dashboard loads in <2 seconds
- [ ] Widgets load in <1 second
- [ ] No layout shift during load
- [ ] Smooth transitions

#### Memory Usage
- [ ] No memory leaks
- [ ] Reasonable memory footprint
- [ ] No performance degradation over time

#### Network Requests
- [ ] Minimal API calls
- [ ] Proper caching
- [ ] No duplicate requests
- [ ] Efficient data fetching

### Error Handling

#### Network Errors
- [ ] Graceful error messages
- [ ] Retry functionality works
- [ ] Fallback to cached data
- [ ] No crashes

#### Permission Errors
- [ ] Clear permission denied messages
- [ ] No data leakage
- [ ] Proper widget hiding
- [ ] No console errors

#### Data Errors
- [ ] Invalid data handled gracefully
- [ ] Validation errors displayed
- [ ] No crashes
- [ ] Recovery options provided

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Responsive Design

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile landscape

## Test Scenarios

### Scenario 1: Owner Viewing Pharmacy Dashboard
1. Login as owner
2. Navigate to pharmacy business
3. Verify OwnerDashboard loads
4. Verify pharmacy-specific widgets visible
5. Verify all permissions granted
6. Test quick actions
7. Verify data accuracy

### Scenario 2: Manager Approving Requests
1. Login as manager
2. Navigate to dashboard
3. Verify ManagerDashboard loads
4. Verify approval queue visible
5. Test approval workflow
6. Verify team metrics visible
7. Verify limited financial access

### Scenario 3: Sales Creating Invoice
1. Login as sales staff
2. Navigate to dashboard
3. Verify SalesDashboard loads
4. Verify quick invoice button
5. Test invoice creation
6. Verify commission tracking
7. Verify limited inventory access

### Scenario 4: Inventory Managing Stock
1. Login as inventory staff
2. Navigate to dashboard
3. Verify InventoryDashboard loads
4. Verify stock alerts visible
5. Test reorder functionality
6. Verify cycle count tasks
7. Verify limited financial access

### Scenario 5: Accountant Viewing Financials
1. Login as accountant
2. Navigate to dashboard
3. Verify AccountantDashboard loads
4. Verify financial metrics visible
5. Test tax calculations
6. Verify FBR compliance
7. Verify limited operational access

## Reporting Issues

### Issue Template

```markdown
**Issue Title**: [Brief description]

**Environment**:
- Feature Flag: Enabled/Disabled
- User Role: Owner/Manager/Sales/Inventory/Accountant
- Business Domain: Pharmacy/Textile/Electronics/Garments/Retail
- Browser: Chrome/Firefox/Safari/Edge
- Device: Desktop/Mobile/Tablet

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[If applicable]

**Console Errors**:
[Copy any console errors]

**Additional Context**:
[Any other relevant information]
```

## Success Criteria

### Must Pass
- ✅ All role templates load correctly
- ✅ Permission filtering works
- ✅ No console errors
- ✅ Load time <2 seconds
- ✅ Backward compatibility maintained
- ✅ Rollback works instantly

### Should Pass
- ✅ All domain-specific widgets visible
- ✅ Responsive design works
- ✅ Error handling graceful
- ✅ Performance acceptable

### Nice to Have
- ✅ Smooth animations
- ✅ Intuitive UX
- ✅ Helpful error messages
- ✅ Fast load times

## Next Steps After Testing

1. **Document findings** in test report
2. **Fix any critical issues** before rollout
3. **Update rollout plan** based on results
4. **Prepare for beta testing** with real users
5. **Monitor production** during gradual rollout

## Support

If you encounter issues:
1. Check console for errors
2. Verify feature flag configuration
3. Test with feature flag disabled
4. Document issue using template above
5. Contact development team

## Rollout Checklist

Before enabling in production:
- [ ] All tests passed
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Rollback tested
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support prepared
