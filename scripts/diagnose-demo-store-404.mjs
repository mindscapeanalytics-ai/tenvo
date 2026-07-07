#!/usr/bin/env node

/**
 * Diagnose why demo stores return 404 on stock API
 * 
 * Checks:
 * 1. Does demo-boutique business exist?
 * 2. Does it have the correct domain in businesses table?
 * 3. Does it have business_custom_domains entry?
 * 4. Is storefront enabled?
 * 5. Can resolveStorefrontBusiness find it?
 */

import pool from '../lib/db.js';
import { resolveStorefrontBusiness } from '../lib/tenancy/resolveStorefrontBusiness.js';

async function diagnoseDemoStore() {
    const testDomain = 'demo-boutique';
    
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   Diagnosing Demo Store: ${testDomain}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    const client = await pool.connect();
    
    try {
        // 1. Check if business exists with this domain
        console.log('🔍 Step 1: Checking businesses table...\n');
        
        const bizResult = await client.query(`
            SELECT id, business_name, domain, category, is_active, is_deleted, 
                   approval_status, plan_tier, created_at
            FROM businesses
            WHERE domain = $1
        `, [testDomain]);
        
        if (bizResult.rows.length === 0) {
            console.log(`❌ PROBLEM: No business found with domain "${testDomain}"`);
            console.log(`   → The business may not exist or has a different domain\n`);
            
            // Check for similar domains
            const similarResult = await client.query(`
                SELECT domain, business_name FROM businesses 
                WHERE domain LIKE $1
                LIMIT 5
            `, [`%${testDomain}%`]);
            
            if (similarResult.rows.length > 0) {
                console.log('   Similar domains found:');
                similarResult.rows.forEach(row => {
                    console.log(`   - ${row.domain} (${row.business_name})`);
                });
            }
            
            return;
        }
        
        const business = bizResult.rows[0];
        console.log('✅ Business found:');
        console.log(`   ID: ${business.id}`);
        console.log(`   Name: ${business.business_name}`);
        console.log(`   Domain: ${business.domain}`);
        console.log(`   Category: ${business.category}`);
        console.log(`   Active: ${business.is_active ?? true}`);
        console.log(`   Deleted: ${business.is_deleted ?? false}`);
        console.log(`   Approval: ${business.approval_status ?? 'N/A'}`);
        console.log(`   Plan: ${business.plan_tier}`);
        console.log(`   Created: ${business.created_at}\n`);
        
        // 2. Check business_custom_domains
        console.log('🔍 Step 2: Checking business_custom_domains...\n');
        
        const customDomainResult = await client.query(`
            SELECT id, domain, is_active, is_primary, created_at
            FROM business_custom_domains
            WHERE business_id = $1::uuid
        `, [business.id]);
        
        if (customDomainResult.rows.length === 0) {
            console.log(`❌ PROBLEM: No custom domain entries found`);
            console.log(`   → Storefront won't be accessible\n`);
            console.log(`   FIX: Run this SQL:`);
            console.log(`   INSERT INTO business_custom_domains (business_id, domain, is_active, is_primary)`);
            console.log(`   VALUES ('${business.id}', '${testDomain}', true, true);\n`);
        } else {
            console.log(`✅ Found ${customDomainResult.rows.length} custom domain(s):`);
            customDomainResult.rows.forEach(row => {
                console.log(`   - ${row.domain} (active: ${row.is_active}, primary: ${row.is_primary})`);
            });
            console.log('');
        }
        
        // 3. Check business_settings (storefront enabled)
        console.log('🔍 Step 3: Checking business_settings...\n');
        
        const settingsResult = await client.query(`
            SELECT is_storefront_enabled, settings
            FROM business_settings
            WHERE business_id = $1::uuid
        `, [business.id]);
        
        if (settingsResult.rows.length === 0) {
            console.log(`⚠️  WARNING: No business_settings found`);
            console.log(`   → Storefront may default to enabled\n`);
        } else {
            const settings = settingsResult.rows[0];
            const isEnabled = settings.is_storefront_enabled ?? true;
            console.log(`   Storefront Enabled: ${isEnabled}`);
            
            if (!isEnabled) {
                console.log(`   ❌ PROBLEM: Storefront is disabled\n`);
            } else {
                console.log(`   ✅ Storefront is enabled\n`);
            }
        }
        
        // 4. Check product count
        console.log('🔍 Step 4: Checking products...\n');
        
        const productResult = await client.query(`
            SELECT COUNT(*) as total,
                   COUNT(*) FILTER (WHERE is_active = true) as active,
                   COUNT(*) FILTER (WHERE is_deleted = true) as deleted
            FROM products
            WHERE business_id = $1::uuid
        `, [business.id]);
        
        const prodStats = productResult.rows[0];
        console.log(`   Total Products: ${prodStats.total}`);
        console.log(`   Active: ${prodStats.active}`);
        console.log(`   Deleted: ${prodStats.deleted}\n`);
        
        // 5. Test resolveStorefrontBusiness
        console.log('🔍 Step 5: Testing resolveStorefrontBusiness()...\n');
        
        try {
            const resolved = await resolveStorefrontBusiness(testDomain);
            
            if (!resolved) {
                console.log(`❌ PROBLEM: resolveStorefrontBusiness returned NULL`);
                console.log(`   → This is why stock API returns 404\n`);
                console.log(`   Possible causes:`);
                console.log(`   1. Domain not in business_custom_domains`);
                console.log(`   2. Storefront disabled in settings`);
                console.log(`   3. Business inactive or deleted`);
                console.log(`   4. Cache issue\n`);
            } else {
                console.log(`✅ Successfully resolved business:`);
                console.log(`   ID: ${resolved.id}`);
                console.log(`   Name: ${resolved.business_name || resolved.businessName}`);
                console.log(`   Domain: ${resolved.domain}\n`);
            }
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}\n`);
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
    } finally {
        client.release();
        await pool.end();
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Diagnosis Complete');
    console.log('═══════════════════════════════════════════════════════');
}

diagnoseDemoStore();
