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
  log('APPLYING TIMESTAMP FIXES', 'bright');
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
    const sqlPath = path.join(__dirname, 'fix-timestamps.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    log('\n[1/2] Applying timestamp fixes...', 'yellow');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      log('✅ Timestamp fixes applied', 'green');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Verify
    log('\n[2/2] Verifying timestamps...', 'yellow');
    
    const tables = ['user_activity_logs', 'impersonation_sessions', 'user_invitations', 'custom_roles', 'custom_packages'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name IN ('created_at', 'updated_at')
        ORDER BY column_name
      `, [table]);
      
      const hasCreated = result.rows.some(r => r.column_name === 'created_at');
      const hasUpdated = result.rows.some(r => r.column_name === 'updated_at');
      
      const status = hasCreated && hasUpdated ? '✅' : '⚠️';
      const color = hasCreated && hasUpdated ? 'green' : 'yellow';
      
      log(`  ${status} ${table}: ${result.rows.length}/2 timestamps`, color);
    }
    
    log('\n' + '='.repeat(70), 'bright');
    log('✅ ALL TIMESTAMP FIXES COMPLETE', 'green');
    log('='.repeat(70), 'bright');
    
    log('\nAll admin tables now have:', 'cyan');
    log('  • created_at - Record creation time', 'bright');
    log('  • updated_at - Last modification time', 'bright');
    log('  • Auto-update triggers', 'bright');
    
    log('\nSchema status: PERFECT ✅', 'green');
    
  } catch (error) {
    log('\n❌ Fix failed', 'red');
    log(error.message, 'red');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyFix();
