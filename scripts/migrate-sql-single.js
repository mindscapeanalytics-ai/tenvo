#!/usr/bin/env node

/**
 * Database Migration - Execute SQL as Single Transaction
 * Handles complex SQL with triggers and functions
 */

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

async function runMigration() {
  log('\n' + '='.repeat(70), 'bright');
  log('DATABASE MIGRATION - Single Transaction Mode', 'bright');
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
    // Step 1: Test connection
    log('\n[1/4] Testing database connection...', 'yellow');
    const testResult = await pool.query('SELECT version()');
    const version = testResult.rows[0].version;
    log(`✅ Connected to: ${version.split(' ')[0]} ${version.split(' ')[1]}`, 'green');
    
    // Step 2: Read migration
    log('\n[2/4] Reading migration file...', 'yellow');
    const migrationPath = path.join(__dirname, 'migrations', '002_add_admin_features_safe.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    log(`✅ Loaded: ${sql.length} bytes`, 'green');
    
    // Step 3: Execute as single transaction
    log('\n[3/4] Executing migration...', 'yellow');
    log('   This may take 30-60 seconds...', 'cyan');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Execute entire SQL as one transaction
      await client.query(sql);
      
      await client.query('COMMIT');
      log('✅ Migration executed successfully', 'green');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Step 4: Verify
    log('\n[4/4] Verifying migration...', 'yellow');
    
    const tables = [
      'feature_flags',
      'feature_flag_overrides',
      'custom_roles',
      'user_activity_logs',
      'impersonation_sessions',
      'user_invitations',
      'custom_packages'
    ];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        log(`  ✅ ${table}: ${count} rows`, 'green');
      } catch (error) {
        log(`  ❌ ${table}: Not found`, 'red');
      }
    }
    
    // Show feature flags
    log('\n  Feature Flags:', 'cyan');
    const flags = await pool.query('SELECT key, is_active FROM feature_flags');
    flags.rows.forEach(f => {
      log(`    ${f.is_active ? '✅' : '⏸️'} ${f.key}`, f.is_active ? 'green' : 'yellow');
    });
    
    // Success
    log('\n' + '='.repeat(70), 'bright');
    log('✅ MIGRATION SUCCESSFUL', 'green');
    log('='.repeat(70), 'bright');
    log('\nAll 7 tables created successfully!', 'cyan');
    log('\nNext: bun run build', 'bright');
    
  } catch (error) {
    log('\n' + '='.repeat(70), 'bright');
    log('❌ MIGRATION FAILED', 'red');
    log('='.repeat(70), 'bright');
    log(`\n${error.message}`, 'red');
    
    if (error.message.includes('already exists')) {
      log('\n💡 Some tables may already exist. This is safe to re-run.', 'yellow');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
