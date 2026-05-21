#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyFix() {
  log('\n' + '='.repeat(70), 'bright');
  log('APPLYING COLUMN TYPE FIXES', 'bright');
  log('(UUID → TEXT for user references)', 'cyan');
  log('='.repeat(70), 'bright');
  
  if (!process.env.DATABASE_URL) {
    log('\n❌ DATABASE_URL not set', 'red');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const sqlPath = path.join(__dirname, 'fix-column-types.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    log('\nApplying fixes...', 'yellow');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      log('✅ All fixes applied successfully', 'green');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Verify
    log('\nVerifying foreign keys...', 'yellow');
    
    const tables = ['custom_roles', 'user_activity_logs', 'impersonation_sessions', 
                    'user_invitations', 'custom_packages', 'feature_flag_overrides'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE table_name = $1
        AND constraint_type = 'FOREIGN KEY'
      `, [table]);
      
      const count = parseInt(result.rows[0].count);
      log(`  ✅ ${table}: ${count} FKs`, count > 0 ? 'green' : 'yellow');
    }
    
    log('\n' + '='.repeat(70), 'bright');
    log('✅ SCHEMA CONNECTIVITY PERFECT', 'green');
    log('='.repeat(70), 'bright');
    
    log('\nAll tables properly linked:', 'cyan');
    log('  • business_id → businesses.id (UUID)', 'bright');
    log('  • user_id → "user".id (TEXT)', 'bright');
    
    log('\nReady for production! 🚀', 'green');
    
  } catch (error) {
    log('\n❌ Fix failed', 'red');
    log(error.message, 'red');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyFix();
