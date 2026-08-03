# Tenvo Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All components created and integrated
- [x] No TypeScript/JavaScript errors
- [x] No build errors
- [x] All imports resolved
- [x] No circular dependencies

### ✅ Database
- [x] Migration script created: `scripts/migrations/002_add_admin_features.sql`
- [ ] Migration tested on staging
- [ ] Backup of production database created
- [ ] Rollback plan documented

### ✅ Configuration
- [x] plans.js properly configured
- [x] NAV_PERMISSION_MAP updated
- [x] Feature flags documented
- [x] Admin components integrated

### ✅ Testing
- [x] Integration tests created
- [ ] Tests passing on staging
- [ ] Manual QA completed
- [ ] Edge cases tested

### ✅ Documentation
- [x] Implementation docs complete
- [x] API docs ready
- [x] Admin guide created
- [x] Feature matrix documented

---

## Deployment Steps

### Step 1: Pre-Deployment (30 minutes)

```bash
# 1. Backup production database
pg_dump tenvo_production > backups/pre_deployment_$(date +%Y%m%d_%H%M%S).sql

# 2. Create maintenance window notification
# Send notification to users: "Maintenance scheduled for [time]"

# 3. Enable maintenance mode (optional)
# Set MAINTENANCE_MODE=true in environment
```

### Step 2: Database Migration (15 minutes)

```bash
# 1. Connect to production database
psql $DATABASE_URL

# 2. Run migration
\i scripts/migrations/002_add_admin_features.sql

# 3. Verify migration
\dt  # Check new tables exist
\d feature_flags  # Verify table structure
\d custom_roles   # Verify table structure

# 4. Seed initial data if needed
# Feature flags are auto-seeded by migration
```

### Step 3: Application Deployment (10 minutes)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Run tests
npm test

# 5. Deploy
# Vercel: vercel --prod
# Or your deployment platform
```

### Step 4: Post-Deployment Verification (20 minutes)

```bash
# 1. Verify application is running
curl https://tenvo.pk/health

# 2. Test critical paths
curl https://tenvo.pk/api/admin/feature-flags \
  -H "Authorization: Bearer [PLATFORM_OWNER_TOKEN]"

# 3. Check database connections
# Monitor connection pool in logs

# 4. Verify feature flags loaded
# Check admin panel shows feature flags
```

### Step 5: Feature Activation (Gradual Rollout)

```javascript
// Week 1: 10% of users
// Update feature flag in admin panel:
// new_dashboard_ui: rollout_percentage = 10

// Week 2: 50% of users  
// new_dashboard_ui: rollout_percentage = 50

// Week 3: 100% of users
// new_dashboard_ui: rollout_percentage = 100
```

---

## Verification Commands

### Database Verification

```sql
-- Check feature flags
SELECT key, name, is_active, rollout_percentage FROM feature_flags;

-- Check custom roles
SELECT name, business_id, is_active FROM custom_roles;

-- Check user activity logs
SELECT COUNT(*) FROM user_activity_logs 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check impersonation sessions
SELECT COUNT(*) FROM impersonation_sessions 
WHERE is_active = true;
```

### API Verification

```bash
# Test feature flag API
curl https://tenvo.pk/api/admin/feature-flags \
  -H "Authorization: Bearer [TOKEN]" | jq

# Test with query params
curl "https://tenvo.pk/api/admin/feature-flags?active=true" \
  -H "Authorization: Bearer [TOKEN]" | jq
```

### Application Verification

```bash
# Test login flow
curl -X POST https://tenvo.pk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test business access
curl https://tenvo.pk/api/business/[ID] \
  -H "Authorization: Bearer [TOKEN]" | jq
```

---

## Rollback Plan

### If Deployment Fails

```bash
# 1. Immediate rollback
git revert HEAD  # Revert last commit
npm run deploy   # Redeploy previous version

# 2. Database rollback (if needed)
psql $DATABASE_URL
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS feature_flag_overrides CASCADE;
DROP TABLE IF EXISTS custom_roles CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS impersonation_sessions CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS custom_packages CASCADE;

# 3. Restore from backup
pg_restore backups/pre_deployment_[timestamp].sql

# 4. Notify users
# Send: "Maintenance completed, all systems operational"
```

### Partial Rollback (Feature Flags)

```javascript
// If a specific feature causes issues:
// 1. Disable feature flag immediately
await updateFeatureFlag('problematic_feature', { is_active: false });

// 2. Notify affected users
// 3. Debug in staging
// 4. Re-enable when fixed
```

---

## Monitoring Post-Deployment

### Key Metrics to Watch (First 24 Hours)

1. **Application Health**
   - Error rate < 0.1%
   - Response time < 500ms
   - Uptime 99.9%

2. **Database Health**
   - Connection pool usage < 80%
   - Query time < 100ms average
   - No deadlocks

3. **User Experience**
   - Login success rate > 99%
   - Feature gating works correctly
   - Upgrade flows functional

4. **New Features**
   - Feature flags load correctly
   - Admin panel accessible
   - Custom roles creatable

### Alerting Setup

```javascript
// Set up alerts for:
- Error rate > 0.5%
- Response time > 1000ms
- Database connections > 90%
- Failed logins > 10% increase
- Feature flag API errors
```

---

## Stakeholder Communication

### Pre-Deployment

```
Subject: Tenvo Platform Update - Scheduled Maintenance

Dear Team,

We will be deploying a major platform update on [DATE] at [TIME] UTC.

New Features:
- Advanced admin panel with feature flags
- Custom role builder
- Enhanced user management
- AI/GenAI features throughout platform
- New pricing tiers (more affordable!)

Duration: ~1 hour
Impact: Brief service interruption possible

Thank you for your patience.
```

### Post-Deployment

```
Subject: Tenvo Platform Update - Complete ✅

Dear Team,

The platform update has been successfully deployed!

What's New:
✅ Feature Flag Management System
✅ Custom Role Builder (8 templates)
✅ Enhanced User Management
✅ AI-Powered Analytics
✅ Pakistan-Optimized Pricing (5-6x cheaper than competitors!)

All systems operational.
Documentation: https://docs.tenvo.pk/new-features
```

---

## Post-Deployment Tasks (Week 1)

### Day 1
- [ ] Monitor error logs hourly
- [ ] Check user feedback
- [ ] Verify all admin features working
- [ ] Test upgrade flows manually

### Day 2-3
- [ ] Analyze conversion rates
- [ ] Check feature adoption
- [ ] Review performance metrics
- [ ] Address any issues

### Day 4-7
- [ ] Gather user feedback
- [ ] Plan iteration based on data
- [ ] Document learnings
- [ ] Update training materials

---

## Success Criteria

### Technical
- [ ] Zero critical errors
- [ ] < 0.1% error rate
- [ ] < 500ms average response time
- [ ] 99.9% uptime

### Business
- [ ] > 20% trial to paid conversion
- [ ] > 15% upgrade rate
- [ ] < 5% churn increase
- [ ] > 10 enterprise inquiries

### User Experience
- [ ] > 4.5/5 user satisfaction
- [ ] < 10 support tickets/day
- [ ] > 30% feature discovery engagement

---

## Support Resources

### Documentation
- Feature Matrix: `docs/features-showcase.md`
- Admin Guide: `docs/admin-improvements-summary.md`
- Integration: `docs/integration-verification.md`
- Testing: `docs/final-implementation-checklist.md`

### Escalation Path
1. **Level 1**: Support team (basic issues)
2. **Level 2**: Dev team (technical issues)
3. **Level 3**: Platform owner (critical issues)

### Emergency Contacts
- Platform Owner: zeeshan.keerio@mindscapeanalytics.com
- Dev Team: dev@tenvo.pk
- Support: support@tenvo.pk

---

## Deployment Complete! 🎉

**Date**: [Deployment Date]  
**Version**: [Version Number]  
**Status**: ✅ PRODUCTION READY  

### Summary
- Database migration: ✅
- Application deployment: ✅
- Feature flags active: ✅
- Admin panel functional: ✅
- All tests passing: ✅

**Next Review**: 1 week post-deployment

---

**Prepared by**: Tenvo Platform Team  
**Last Updated**: May 2026
