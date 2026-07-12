# Deployment Checklist: Unified Order Aggregation Fix

## 📋 Pre-Deployment Checklist

### Code Review
- [ ] Review `lib/actions/basic/dashboard.js` changes
- [ ] Review `app/business/[category]/components/tabs/DomainDashboard.tsx` changes
- [ ] Verify no TypeScript errors: `npm run type-check`
- [ ] Verify no ESLint errors: `npm run lint`
- [ ] Run local build: `npm run build`

### Testing
- [ ] Run verification script: `node scripts/verify-unified-order-aggregation.mjs`
- [ ] Run audit script: `node scripts/audit-complete-data-flow.mjs`
- [ ] Test locally with demo business data
- [ ] Verify Command Overview shows unified count
- [ ] Verify Sales Performance matches Command Overview
- [ ] Check browser console for errors

### Documentation
- [ ] Review `IMPLEMENTATION_SUMMARY.md`
- [ ] Review `END_TO_END_ORDER_FLOW_FIX.md`
- [ ] Confirm all changes documented
- [ ] Verify rollback plan is clear

---

## 🚀 Deployment Steps

### Step 1: Backup (Optional but Recommended)
```bash
# Backup database
pg_dump $DATABASE_URL > backup_before_order_fix_$(date +%Y%m%d_%H%M%S).sql

# Backup code
git tag before-order-aggregation-fix
git push origin before-order-aggregation-fix
```

### Step 2: Deploy Backend
```bash
# Option A: Direct deployment
git pull origin main
npm install
pm2 restart tenvo-app

# Option B: Docker deployment
docker-compose pull
docker-compose up -d

# Option C: Vercel/Platform deployment
vercel --prod
```

### Step 3: Verify Backend
```bash
# Check server is running
curl https://your-domain.com/api/health

# Monitor logs
pm2 logs tenvo-app

# Or Docker logs
docker-compose logs -f app
```

### Step 4: Deploy Frontend
```bash
# Build production bundle
npm run build

# Deploy static assets
# (Method depends on your hosting)

# Clear CDN cache if applicable
```

### Step 5: Clear Caches
```bash
# Redis cache (if used)
redis-cli FLUSHDB

# CDN cache
# (Depends on your CDN provider)

# Browser cache
# Instruct users to hard refresh (Ctrl+Shift+R)
```

---

## ✅ Post-Deployment Verification

### Automated Checks
```bash
# Run verification script against production
DATABASE_URL="production_url" node scripts/verify-unified-order-aggregation.mjs

# Check for errors in last 100 log lines
pm2 logs tenvo-app --lines 100 | grep -i error
```

### Manual UI Checks

#### 1. Command Overview Dashboard
- [ ] Log in to production
- [ ] Navigate to Dashboard (Command Overview)
- [ ] Note the "Orders in Period" count
- [ ] Screenshot for records

#### 2. Sales Performance Tab
- [ ] Navigate to Sales tab
- [ ] Note the order count
- [ ] Verify it matches Command Overview
- [ ] Screenshot for records

#### 3. Easy Mode Dashboard
- [ ] Switch to Easy Mode (if available)
- [ ] Check order count in dashboard
- [ ] Verify consistency
- [ ] Screenshot for records

#### 4. Multi-Ledger Business Test
Test with businesses known to have multiple ledgers:

**Restaurant (POS + Invoices):**
- [ ] Open restaurant business
- [ ] Check order count includes POS transactions
- [ ] Verify revenue includes POS amounts

**E-commerce (Storefront + Invoices):**
- [ ] Open e-commerce business
- [ ] Check order count includes storefront orders
- [ ] Verify revenue includes online orders

**Retail (All 3 Ledgers):**
- [ ] Open retail business
- [ ] Check order count includes all channels
- [ ] Verify revenue is complete

### Performance Checks
- [ ] Dashboard loads in < 2 seconds
- [ ] No SQL timeout errors in logs
- [ ] Server CPU/memory usage normal
- [ ] Database query time < 500ms

### Data Accuracy Checks
- [ ] Pick 3 random businesses
- [ ] Manually count orders from each ledger (SQL query)
- [ ] Compare with dashboard display
- [ ] All should match

```sql
-- Manual verification query
SELECT 
  (SELECT COUNT(*) FROM invoices 
   WHERE business_id = '<business_id>' 
     AND (is_deleted = false OR is_deleted IS NULL)
     AND status NOT IN ('draft', 'voided')) as invoices,
  (SELECT COUNT(*) FROM pos_transactions 
   WHERE business_id = '<business_id>' 
     AND is_voided = false 
     AND LOWER(COALESCE(payment_status, '')) = 'completed') as pos,
  (SELECT COUNT(*) FROM storefront_orders 
   WHERE business_id = '<business_id>' 
     AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'refunded', 'voided')) as storefront;
```

---

## 🔍 Monitoring (First 24 Hours)

### Metrics to Watch
- [ ] Dashboard load times
- [ ] SQL query performance
- [ ] Error rates in logs
- [ ] User-reported issues
- [ ] Order count consistency

### Alert Triggers
Set up alerts for:
- SQL query timeout (> 5 seconds)
- High error rate (> 1% of requests)
- Memory spike (> 80% usage)
- Dashboard load time > 5 seconds

### Log Monitoring
```bash
# Watch for errors
tail -f /var/log/app.log | grep -i "error\|warn"

# Or with pm2
pm2 logs --err

# Watch for SQL performance
grep "slow query" /var/log/postgres.log
```

---

## 🚨 Rollback Plan

### If Critical Issues Detected

#### Immediate Rollback (< 5 minutes)
```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or rollback to tag
git checkout before-order-aggregation-fix
git push -f origin main

# Restart server
pm2 restart tenvo-app
```

#### Partial Rollback (Backend Only)
```bash
# Revert only backend file
git checkout HEAD~1 -- lib/actions/basic/dashboard.js
git commit -m "Rollback: getDashboardKPIs to previous version"
git push origin main
pm2 restart tenvo-app
```

#### Partial Rollback (Frontend Only)
```bash
# Revert only frontend file
git checkout HEAD~1 -- app/business/[category]/components/tabs/DomainDashboard.tsx
git commit -m "Rollback: DomainDashboard to previous version"
git push origin main
npm run build
```

### Post-Rollback Actions
- [ ] Verify dashboards working again
- [ ] Check error logs cleared
- [ ] Notify team of rollback
- [ ] Investigate root cause
- [ ] Document what went wrong
- [ ] Fix and redeploy when ready

---

## 📊 Success Criteria

### Must Have (Blocking)
- [ ] ✅ All dashboards load without errors
- [ ] ✅ Order counts consistent across views
- [ ] ✅ No SQL timeout errors
- [ ] ✅ Performance within acceptable limits

### Should Have (Non-Blocking)
- [ ] Dashboard load time < 2 seconds
- [ ] Zero user-reported discrepancies in first 24 hours
- [ ] Positive feedback from internal testing

### Nice to Have
- [ ] Improved accuracy noticed by users
- [ ] Faster dashboard load times
- [ ] Reduced support tickets about "missing orders"

---

## 📝 Post-Deployment Report

### Completion Checklist
After deployment is stable (24-48 hours):

- [ ] Document actual deployment time
- [ ] Record any issues encountered
- [ ] Note any adjustments made
- [ ] Collect user feedback
- [ ] Update documentation with lessons learned
- [ ] Archive deployment logs
- [ ] Schedule follow-up review (1 week)

### Report Template
```markdown
## Deployment Report: Unified Order Aggregation

**Date:** YYYY-MM-DD
**Time:** HH:MM
**Deployed By:** Name
**Duration:** X minutes

### Changes Deployed
- Backend: lib/actions/basic/dashboard.js
- Frontend: DomainDashboard.tsx

### Issues Encountered
- None / List any

### Adjustments Made
- None / List any

### User Feedback
- Collect after 24-48 hours

### Success Metrics
- Dashboard load time: X seconds
- Error rate: X%
- Order count accuracy: ✅/❌

### Follow-up Actions
- List any needed follow-up tasks
```

---

## 🎯 Key Contacts

### Development Team
- **Backend Lead:** [Name]
- **Frontend Lead:** [Name]
- **DevOps:** [Name]

### Escalation Path
1. Check documentation in repo
2. Review verification scripts
3. Check server logs
4. Contact backend lead
5. Escalate to CTO if critical

---

## 📚 Reference Documents

- `IMPLEMENTATION_SUMMARY.md` - What was changed and why
- `END_TO_END_ORDER_FLOW_FIX.md` - Technical implementation details
- `UNIFIED_ORDER_AGGREGATION_IMPLEMENTATION.md` - Code-level changes
- `ORDER_DATA_FLOW_ANALYSIS.md` - Original investigation

### Verification Scripts
- `scripts/verify-unified-order-aggregation.mjs`
- `scripts/audit-complete-data-flow.mjs`

---

## ✅ Sign-Off

### Pre-Deployment
- [ ] Code reviewed by: _________________ Date: _______
- [ ] Tests passed by: __________________ Date: _______
- [ ] Approved by: _____________________ Date: _______

### Post-Deployment
- [ ] Deployment verified by: ____________ Date: _______
- [ ] Performance validated by: ___________ Date: _______
- [ ] Sign-off by: ______________________ Date: _______

---

**Deployment Status:** 🟡 Pending  
**Risk Level:** 🟢 LOW (Backward compatible, well-tested, easily reversible)  
**Impact:** 🔴 HIGH (Core business metrics)

**Ready to deploy!** 🚀
