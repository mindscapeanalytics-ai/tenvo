/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  Platform Owner Setup Script                                 ║
 * ║  Configures a user as PLATFORM ADMIN + BUSINESS OWNER        ║
 * ║                                                              ║
 * ║  Usage:  node scripts/setup-owner.mjs                        ║
 * ║                                                              ║
 * ║  What it does:                                               ║
 * ║  1. Sets user.role = 'admin' (BetterAuth platform admin)     ║
 * ║  2. Ensures 'owner' role in all business_users entries       ║
 * ║  3. Upgrades all owned businesses to 'enterprise' plan       ║
 * ║  4. Removes any bans or restrictions                         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import pg from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const OWNER_EMAIL = 'zeeshan.keerio@mindscapeanalytics.com';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function setupOwner() {
    const client = await pool.connect();
    console.log('\n🔧 Platform Owner Setup');
    console.log('═'.repeat(60));
    console.log(`📧 Target: ${OWNER_EMAIL}\n`);

    try {
        await client.query('BEGIN');

        // ─── Step 1: Find or verify the user ────────────────────────
        const userResult = await client.query(
            'SELECT id, name, email, role, banned, "twoFactorEnabled" FROM "user" WHERE email = $1',
            [OWNER_EMAIL]
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User not found in database.');
            console.log('   → Please register first at /register, then re-run this script.');
            console.log('   → Or create the account manually via the app.\n');
            await client.query('ROLLBACK');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ User found: ${user.name} (${user.id})`);
        console.log(`   Current role: ${user.role || 'none'}`);
        console.log(`   Banned: ${user.banned ? 'YES ⚠️' : 'No'}`);

        // ─── Step 2: Set BetterAuth platform admin role ─────────────
        await client.query(
            `UPDATE "user" SET role = 'admin', banned = false, "banReason" = NULL, "banExpires" = NULL WHERE id = $1`,
            [user.id]
        );
        console.log('\n✅ Platform role set to: admin');
        console.log('   → Full platform-level administrative privileges granted');

        // ─── Step 3: Find all businesses owned by this user ─────────
        const businessResult = await client.query(
            'SELECT id, business_name, domain, category, plan_tier FROM businesses WHERE user_id = $1',
            [user.id]
        );

        if (businessResult.rows.length === 0) {
            console.log('\n⚠️  No businesses found for this user.');
            console.log('   → The user can create businesses after logging in.');
        } else {
            console.log(`\n📊 Found ${businessResult.rows.length} business(es):\n`);

            for (const biz of businessResult.rows) {
                console.log(`   🏢 ${biz.business_name} (${biz.domain})`);
                console.log(`      Category: ${biz.category} | Plan: ${biz.plan_tier}`);

                // Ensure owner role in business_users
                await client.query(`
                    INSERT INTO business_users (business_id, user_id, role, status)
                    VALUES ($1, $2, 'owner', 'active')
                    ON CONFLICT (business_id, user_id)
                    DO UPDATE SET role = 'owner', status = 'active'
                `, [biz.id, user.id]);
                console.log('      ✅ business_users: role=owner, status=active');

                // Upgrade plan to enterprise
                await client.query(`
                    UPDATE businesses SET 
                        plan_tier = 'enterprise',
                        plan_seats = 999,
                        max_products = 999999,
                        max_warehouses = 999
                    WHERE id = $1
                `, [biz.id]);
                console.log('      ✅ Plan upgraded to: enterprise (unlimited)');
            }
        }

        // ─── Step 4: Grant access to ALL businesses (platform admin) ─
        const allBusinesses = await client.query(
            'SELECT id, business_name FROM businesses WHERE user_id != $1',
            [user.id]
        );

        if (allBusinesses.rows.length > 0) {
            console.log(`\n🌐 Granting admin access to ${allBusinesses.rows.length} other business(es):\n`);
            for (const biz of allBusinesses.rows) {
                await client.query(`
                    INSERT INTO business_users (business_id, user_id, role, status)
                    VALUES ($1, $2, 'admin', 'active')
                    ON CONFLICT (business_id, user_id)
                    DO UPDATE SET role = 'admin', status = 'active'
                `, [biz.id, user.id]);
                console.log(`   ✅ ${biz.business_name}: admin access granted`);
            }
        }

        await client.query('COMMIT');

        // ─── Summary ────────────────────────────────────────────────
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 Setup Complete!\n');
        console.log('   Platform Role:    admin (full platform control)');
        console.log('   Business Role:    owner (all owned businesses)');
        console.log('   Plan Tier:        enterprise (unlimited resources)');
        console.log('   Capabilities:');
        console.log('     • Manage all users, roles & permissions');
        console.log('     • Manage all business plans & subscriptions');
        console.log('     • Full CRUD on all modules across all businesses');
        console.log('     • Access platform admin dashboard');
        console.log('     • Bypass all plan & resource limits');
        console.log('\n' + '═'.repeat(60) + '\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Setup failed:', error.message);
        console.error(error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

setupOwner();
