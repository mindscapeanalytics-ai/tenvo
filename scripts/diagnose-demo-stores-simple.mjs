#!/usr/bin/env node

/**
 * Simple Demo Store Diagnostic
 * Checks if demo stores exist and are properly configured
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
      console.error('[diagnose] Failed to read DATABASE_SSL_CA_PATH:', caPath, e);
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

async function diagnose() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Demo Store Diagnostic');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const client = await pool.connect();
    
    try {
        // 1. Check demo stores
        console.log('🔍 Checking demo stores in businesses table...\n');
        
        const bizResult = await client.query(`
            SELECT 
                b.id, 
                b.business_name, 
                b.domain, 
                b.is_active, 
                b.approval_status,
                COALESCE(bs.is_storefront_enabled, true) AS is_storefront_enabled
            FROM businesses b
            LEFT JOIN business_settings bs ON b.id = bs.business_id
            WHERE b.domain LIKE 'demo-%'
            ORDER BY b.created_at DESC
            LIMIT 5
        `);
        
        if (bizResult.rows.length === 0) {
            console.log('⚠️  No demo stores found\n');
            return;
        }
        
        console.log(`✅ Found ${bizResult.rows.length} demo stores (showing first 5):\n`);
        
        for (const biz of bizResult.rows) {
            const status = !biz.is_active 
                ? '❌ INACTIVE' 
                : !biz.is_storefront_enabled
                    ? '⛔ STOREFRONT DISABLED'
                    : '✅ ACTIVE';
            
            console.log(`${status} ${biz.domain}`);
            console.log(`   Name: ${biz.business_name}`);
            console.log(`   ID: ${biz.id}`);
            console.log(`   Active: ${biz.is_active}`);
            console.log(`   Storefront Enabled: ${biz.is_storefront_enabled}`);
            console.log(`   Approval: ${biz.approval_status}\n`);
            
            // Check products for this store
            const prodResult = await client.query(`
                SELECT COUNT(*) as total,
                       COUNT(*) FILTER (WHERE is_active = true AND is_deleted = false) as active
                FROM products
                WHERE business_id = $1
            `, [biz.id]);
            
            const { total, active } = prodResult.rows[0];
            console.log(`   Products: ${active}/${total} active\n`);
        }
        
        // 2. Check if business_custom_domains table exists
        console.log('🔍 Checking if business_custom_domains table exists...\n');
        
        try {
            const customDomainCheck = await client.query(`
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_name = 'business_custom_domains'
            `);
            
            if (customDomainCheck.rows[0].count > 0) {
                console.log('✅ business_custom_domains table EXISTS\n');
                
                // Check how many demo stores have custom domain entries
                const customDomainResult = await client.query(`
                    SELECT 
                        b.domain,
                        COUNT(bcd.id) as custom_domain_count
                    FROM businesses b
                    LEFT JOIN business_custom_domains bcd ON bcd.business_id = b.id
                    WHERE b.domain LIKE 'demo-%'
                    GROUP BY b.domain
                    ORDER BY b.domain
                    LIMIT 5
                `);
                
                console.log('Custom domain entries:\n');
                customDomainResult.rows.forEach(row => {
                    const status = row.custom_domain_count > 0 ? '✅' : '❌ MISSING';
                    console.log(`   ${status} ${row.domain}: ${row.custom_domain_count} entries`);
                });
                console.log('');
                
            } else {
                console.log('ℹ️  business_custom_domains table DOES NOT EXIST');
                console.log('   This is OK - the system falls back to businesses.domain\n');
            }
        } catch (err) {
            console.log(`ℹ️  Could not check business_custom_domains table: ${err.message}\n`);
        }
        
        // 3. Test domain resolution logic
        console.log('🔍 Testing domain resolution for demo-boutique...\n');
        
        const testDomain = 'demo-boutique';
        const domainResult = await client.query(`
            SELECT
                b.id, b.business_name, b.domain, b.email, b.phone,
                b.category, b.city, b.country, b.plan_tier,
                b.is_active,
                COALESCE(bs.is_storefront_enabled, true) AS is_storefront_enabled,
                bs.settings AS store_settings
            FROM businesses b
            LEFT JOIN business_settings bs ON b.id = bs.business_id
            WHERE LOWER(b.domain) = $1 AND COALESCE(b.is_active, true) = true
        `, [testDomain]);
        
        if (domainResult.rows.length > 0) {
            const row = domainResult.rows[0];
            console.log('✅ Domain resolution WORKS\n');
            console.log(`   Resolved to: ${row.business_name} (${row.id})`);
            console.log(`   Storefront enabled: ${row.is_storefront_enabled}`);
            console.log(`   Plan tier: ${row.plan_tier || 'starter'}\n`);
        } else {
            console.log('❌ Domain resolution FAILED - no business found for demo-boutique\n');
        }
        
        // 4. Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('   Diagnostic Complete');
        console.log('═══════════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run diagnostic
diagnose();
