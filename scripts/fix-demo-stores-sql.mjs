#!/usr/bin/env node

/**
 * Fix Demo Stores 404 Issue - SQL Approach
 * 
 * Uses raw SQL to fix demo stores without Prisma client issues
 */

import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';

// Database configuration (matching lib/db.js)
function getPoolSsl() {
  if (!process.env.DATABASE_URL) return false;
  if (process.env.DATABASE_SSL_DISABLE === 'true') return false;

  const url = process.env.DATABASE_URL.toLowerCase();
  const useTls =
    url.includes('sslmode=require') ||
    url.includes('sslmode=verify-full') ||
    url.includes('sslmode=no-verify') ||
    url.includes('.neon.tech') ||
    url.includes('supabase.co') ||
    url.includes('amazonaws.com') ||
    Boolean(process.env.DATABASE_SSL_CA_PATH);

  if (!useTls) return false;

  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (caPath) {
    try {
      const ca = fs.readFileSync(caPath, 'utf8');
      return { rejectUnauthorized: true, ca };
    } catch (e) {
      console.error('[fix-demo-stores] Failed to read DATABASE_SSL_CA_PATH:', caPath, e);
      throw e;
    }
  }

  const wantStrictVerify =
    process.env.DATABASE_SSL_STRICT === 'true' || url.includes('sslmode=verify-full');

  if (wantStrictVerify) {
    return { rejectUnauthorized: true };
  }

  return { rejectUnauthorized: false };
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: getPoolSsl(),
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 20000,
    maxUses: 7500,
});

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'postgresql://dummy:dummy@localhost:5432/dummy') {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Please ensure .env file exists and contains DATABASE_URL');
    process.exit(1);
}

async function fixDemoStores() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Fixing Demo Stores 404 Issue (SQL)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const client = await pool.connect();
    
    try {
        // 1. Find all demo stores
        console.log('🔍 Step 1: Finding demo stores...\n');
        
        const demoBizResult = await client.query(`
            SELECT id, business_name, domain, is_active, approval_status
            FROM businesses
            WHERE domain LIKE 'demo-%' OR business_name LIKE '%Demo%'
            ORDER BY created_at DESC
        `);
        
        if (demoBizResult.rows.length === 0) {
            console.log('⚠️  No demo stores found in database\n');
            return;
        }
        
        console.log(`✅ Found ${demoBizResult.rows.length} demo store(s):`);
        demoBizResult.rows.forEach(b => {
            const status = !b.is_active 
                ? '❌ INACTIVE' 
                : (b.approval_status !== 'approved' && b.approval_status !== 'auto_approved')
                    ? '⏳ PENDING' 
                    : '✅ ACTIVE';
            console.log(`   ${status} ${b.domain} (${b.business_name}) [${b.approval_status}]`);
        });
        console.log('');
        
        // 2. Activate and auto-approve stores
        console.log('🔧 Step 2: Activating stores and ensuring approval...\n');
        
        const activateResult = await client.query(`
            UPDATE businesses
            SET 
                is_active = true,
                approval_status = 'auto_approved',
                updated_at = NOW()
            WHERE (domain LIKE 'demo-%' OR business_name LIKE '%Demo%')
              AND (is_active = false OR approval_status NOT IN ('approved', 'auto_approved'))
        `);
        
        if (activateResult.rowCount > 0) {
            console.log(`✅ Activated and approved ${activateResult.rowCount} store(s)`);
        } else {
            console.log(`✅ All stores are already active and approved`);
        }
        console.log('');
        
        // 3. Add missing custom domain entries
        console.log('🔧 Step 3: Adding missing custom domain entries...\n');
        
        const customDomainResult = await client.query(`
            INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)
            SELECT b.id, b.domain, true, true
            FROM businesses b
            WHERE (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%')
              AND NOT EXISTS (
                  SELECT 1 
                  FROM business_custom_domains bcd 
                  WHERE bcd.business_id = b.id AND bcd.domain = b.domain
              )
            ON CONFLICT (business_id, domain) 
            DO UPDATE SET 
                is_active = true,
                is_primary = true,
                updated_at = NOW()
        `);
        
        console.log(`✅ Added/fixed ${customDomainResult.rowCount} custom domain entries\n`);
        
        // 4. Enable storefront
        console.log('🔧 Step 4: Enabling storefronts...\n');
        
        // First, create missing business_settings
        const createSettingsResult = await client.query(`
            INSERT INTO business_settings (business_id, is_storefront_enabled, settings)
            SELECT b.id, true, '{"storefront": {"enabled": true}}'::jsonb
            FROM businesses b
            WHERE (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%')
              AND NOT EXISTS (
                  SELECT 1 FROM business_settings bs WHERE bs.business_id = b.id
              )
        `);
        
        if (createSettingsResult.rowCount > 0) {
            console.log(`   ✅ Created settings for ${createSettingsResult.rowCount} store(s)`);
        }
        
        // Then, enable storefront for existing settings
        const enableStorefrontResult = await client.query(`
            UPDATE business_settings bs
            SET 
                is_storefront_enabled = true,
                updated_at = NOW()
            FROM businesses b
            WHERE bs.business_id = b.id
              AND (b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%')
              AND bs.is_storefront_enabled = false
        `);
        
        if (enableStorefrontResult.rowCount > 0) {
            console.log(`   ✅ Enabled storefront for ${enableStorefrontResult.rowCount} store(s)`);
        }
        
        if (createSettingsResult.rowCount === 0 && enableStorefrontResult.rowCount === 0) {
            console.log(`   ✅ All storefronts already enabled`);
        }
        console.log('');
        
        // 5. Verify product counts
        console.log('📊 Step 5: Checking product counts...\n');
        
        for (const business of demoBizResult.rows) {
            const productResult = await client.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE is_deleted = false) as total,
                    COUNT(*) FILTER (WHERE is_deleted = false AND is_active = true) as active
                FROM products
                WHERE business_id = $1
            `, [business.id]);
            
            const { total, active } = productResult.rows[0];
            console.log(`   ${business.domain}: ${active}/${total} active products`);
        }
        console.log('');
        
        // 6. Verify custom domains exist now
        console.log('📊 Step 6: Verifying custom domains...\n');
        
        const verifyResult = await client.query(`
            SELECT 
                b.domain,
                b.is_active as business_active,
                b.approval_status,
                bcd.domain as custom_domain,
                bcd.is_active as domain_active,
                bs.is_storefront_enabled
            FROM businesses b
            LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id AND bcd.domain = b.domain
            LEFT JOIN business_settings bs ON bs.business_id = b.id
            WHERE b.domain LIKE 'demo-%' OR b.business_name LIKE '%Demo%'
            ORDER BY b.created_at DESC
        `);
        
        verifyResult.rows.forEach(r => {
            const domainStatus = r.custom_domain && r.domain_active ? '✅' : '❌';
            const storefrontStatus = r.is_storefront_enabled ? '✅' : '❌';
            console.log(`   ${domainStatus} ${r.domain}: domain=${!!r.custom_domain} storefront=${r.is_storefront_enabled}`);
        });
        console.log('');
        
        // 7. Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('   ✅ Fix Complete!');
        console.log('═══════════════════════════════════════════════════════\n');
        
        console.log('📋 Summary:');
        console.log(`   • Found ${demoBizResult.rows.length} demo store(s)`);
        console.log(`   • Activated/approved ${activateResult.rowCount} store(s)`);
        console.log(`   • Added/fixed ${customDomainResult.rowCount} custom domain entries`);
        console.log(`   • Created ${createSettingsResult.rowCount} new settings`);
        console.log(`   • Enabled ${enableStorefrontResult.rowCount} storefronts\n`);
        
        console.log('🔄 Next Steps:');
        console.log('   1. Purge Redis cache:');
        console.log('      redis-cli FLUSHDB');
        console.log('   2. Clear browser cache and refresh demo stores');
        console.log('   3. Test stock API by clicking product variants\n');
        
        console.log('📝 Test URLs:');
        demoBizResult.rows.forEach(b => {
            console.log(`   • https://tenvo.store/store/${b.domain}`);
        });
        console.log('');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixDemoStores();
