# Database Migration Execution Guide

## Pre-Migration Checklist

Before running the migration, ensure:

- [ ] Application build is successful (`bun run build` passes)
- [ ] Database is accessible
- [ ] Backup disk space available (min 100MB)
- [ ] Maintenance window scheduled (if production)
- [ ] Rollback plan ready

## Quick Start (Recommended)

### Option 1: Using Batch Script (Windows)

```cmd
# Navigate to project directory
cd e:\tenvo-main

# Run migration
scripts\migrate-windows.bat
```

### Option 2: Using Node.js Script (Cross-Platform)

```bash
# Navigate to project directory
cd e:\tenvo-main

# Run migration
node scripts/execute-migration.js
```

### Option 3: Manual Execution

```bash
# 1. Create backup
pg_dump $DATABASE_URL > backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Execute migration
psql $DATABASE_URL -f scripts/migrations/002_add_admin_features.sql

# 3. Verify
psql $DATABASE_URL -f scripts/verify-database.sql
```

---

## Step-by-Step Migration Process

### Step 1: Environment Setup (2 minutes)

**Verify DATABASE_URL is set:**

```bash
# Check if environment variable exists
echo $DATABASE_URL

# Or check .env file
cat .env | grep DATABASE_URL
```

**Expected output:**
```
postgresql://user:password@host:port/database
```

**If not set:**
```bash
# Windows (Command Prompt)
set DATABASE_URL=postgresql://user:password@host:port/database

# Windows (PowerShell)
$env:DATABASE_URL="postgresql://user:password@host:port/database"

# Linux/Mac
export DATABASE_URL=postgresql://user:password@host:port/database
```

---

### Step 2: Pre-Migration Backup (3 minutes)

**Automated (via script):**
The migration script automatically creates a backup in `backups/` directory.

**Manual:**
```bash
# Create backups directory if not exists
mkdir -p backups

# Create timestamped backup
pg_dump $DATABASE_URL > backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file size
ls -lh backups/
```

---

### Step 3: Execute Migration (5 minutes)

**Using the batch script:**
```cmd
scripts\migrate-windows.bat
```

**What the migration creates:**

| Table | Purpose | Records |
|-------|---------|---------|
| `feature_flags` | Platform-wide feature toggles | 5 (seeded) |
| `feature_flag_overrides` | Business/user specific overrides | 0 |
| `custom_roles` | Custom role definitions | 0 |
| `user_activity_logs` | Audit trail | 0 |
| `impersonation_sessions` | Support impersonation log | 0 |
| `user_invitations` | User invitation system | 0 |
| `custom_packages` | Enterprise custom packages | 0 |

---

### Step 4: Verify Migration (2 minutes)

**Run verification script:**
```bash
psql $DATABASE_URL -f scripts/verify-database.sql
```

**Expected output:**
```
    table_name    | exists
------------------+--------
 feature_flags    | t
 feature_flag_overrides | t
 custom_roles     | t
 user_activity_logs | t
 impersonation_sessions | t
 user_invitations | t
 custom_packages  | t

  check_name   | count
---------------+-------
 Feature Flags |     5

       key       |         name          | is_active | rollout_percentage
-----------------+-----------------------+-----------+---------------------
 new_dashboard_ui| New Dashboard UI      | t         |                 100
 beta_ai_features| Beta AI Features      | f         |                   0
 advanced_reporting| Advanced Reporting  | f         |                 100
 mobile_app_beta | Mobile App Beta       | f         |                   0
 whatsapp_integration| WhatsApp Integration| f       |                   0

Migration Verification Complete
```

---

### Step 5: Post-Migration Steps (5 minutes)

**1. Run application build:**
```bash
bun run build
```

**2. Start development server to test:**
```bash
bun run dev
```

**3. Test admin panel:**
- Navigate to `http://localhost:3000/admin`
- Login as platform owner
- Verify "Feature Flags" tab is visible
- Verify feature flags are displayed

**4. Test API endpoints:**
```bash
# Get feature flags
curl http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

---

## Troubleshooting

### Issue: "psql not found"

**Solution:**
1. Install PostgreSQL client tools
2. Or use Docker:
   ```bash
   docker run -e PGHOST=host -e PGUSER=user -e PGPASSWORD=pass postgres:15-alpine psql
   ```

### Issue: "Connection refused"

**Solution:**
1. Check database server is running
2. Verify connection string in `.env`
3. Check firewall rules

### Issue: "Permission denied"

**Solution:**
1. Verify database user has CREATE TABLE permissions
2. Check schema permissions:
   ```sql
   GRANT ALL ON SCHEMA public TO your_user;
   ```

### Issue: Migration fails mid-way

**Rollback:**
```bash
# Restore from backup
psql $DATABASE_URL < backups/pre_migration_[timestamp].sql
```

**Or manually drop tables:**
```sql
DROP TABLE IF EXISTS custom_packages CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS impersonation_sessions CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS custom_roles CASCADE;
DROP TABLE IF EXISTS feature_flag_overrides CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
```

---

## Migration Safety Features

### ✅ Automatic Backup
Every migration creates a timestamped backup before executing.

### ✅ Transaction Safety
All CREATE TABLE statements are wrapped in implicit transactions.

### ✅ Idempotent Design
Running migration twice won't cause errors (IF NOT EXISTS checks).

### ✅ Verification Suite
Post-migration verification checks all tables and indexes.

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Database backup created and verified
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Rollback plan tested

### During Deployment
- [ ] Execute migration during low-traffic period
- [ ] Monitor database connection pool
- [ ] Watch error logs
- [ ] Keep backup handy

### Post-Deployment
- [ ] Verify all new tables exist
- [ ] Test admin panel access
- [ ] Check feature flags API
- [ ] Monitor application metrics
- [ ] Notify team of completion

---

## Migration Files Reference

| File | Purpose |
|------|---------|
| `scripts/migrations/002_add_admin_features.sql` | Main migration SQL |
| `scripts/execute-migration.js` | Node.js migration runner |
| `scripts/migrate-windows.bat` | Windows batch script |
| `scripts/verify-database.sql` | Post-migration verification |

---

## Support

**If migration fails:**
1. Check error message in console
2. Review logs in `logs/` directory
3. Contact: dev@tenvo.pk
4. Emergency: zeeshan.keerio@mindscapeanalytics.com

**Documentation:**
- Migration Guide: This document
- Feature Docs: `docs/admin-improvements-summary.md`
- API Docs: See `app/api/admin/feature-flags/*`

---

**Migration ID**: 002_add_admin_features  
**Created**: 2026-05-21  
**Author**: Tenvo Platform Team  
**Status**: Ready for Production ✅
