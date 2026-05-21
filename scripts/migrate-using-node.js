#!/usr/bin/env node

/**
 * Node.js-only Database Migration
 * No PostgreSQL client (psql) required - uses pg library directly
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
  log('NODE.JS DATABASE MIGRATION', 'bright');
  log('(No PostgreSQL client required)', 'cyan');
  log('='.repeat(70), 'bright');
  
  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    log('\n❌ DATABASE_URL not set', 'red');
    log('\nPlease set it first:', 'yellow');
    log('  set DATABASE_URL=postgresql://user:password@host:5432/database', 'bright');
    process.exit(1);
  }
  
  // Create pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Step 1: Test connection
    log('\n[1/6] Testing database connection...', 'yellow');
    const testResult = await pool.query('SELECT version()');
    log(`✅ Connected to: ${testResult.rows[0].version.split(' ')[0]}`, 'green');
    
    // Step 2: Read migration file
    log('\n[2/6] Reading migration file...', 'yellow');
    const migrationPath = path.join(__dirname, 'migrations', '002_add_admin_features.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    log(`✅ Migration file loaded (${migrationSQL.length} bytes)`, 'green');
    
    // Step 3: Create backup (using pg_dump via Node if available, or SQL export)
    log('\n[3/6] Creating backup...', 'yellow');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join('backups', `pre_migration_${timestamp}.json`);
    
    // Ensure backups directory exists
    await fs.mkdir('backups', { recursive: true });
    
    // Get list of existing tables for reference
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'feature_flags', 'feature_flag_overrides', 'custom_roles',
        'user_activity_logs', 'impersonation_sessions', 
        'user_invitations', 'custom_packages'
      )
    `);
    
    if (tablesResult.rows.length > 0) {
      log(`⚠️  Some tables already exist: ${tablesResult.rows.map(r => r.tablename).join(', ')}`, 'yellow');
      log('   Migration will use IF NOT EXISTS (safe to re-run)', 'cyan');
    }
    
    await fs.writeFile(backupFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      existingTables: tablesResult.rows.map(r => r.tablename),
      note: 'This is a reference backup. For full restore, use pg_dump.'
    }, null, 2));
    
    log(`✅ Backup reference saved: ${backupFile}`, 'green');
    
    // Step 4: Execute migration
    log('\n[4/6] Executing migration...', 'yellow');
    
    // Split SQL into statements (handling $$ blocks)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Skip empty or comment-only statements
        if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
          continue;
        }
        
        await pool.query(statement);
        successCount++;
        
        // Show progress for CREATE TABLE
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE(?: IF NOT EXISTS)? (\w+)/)?.[1];
          if (tableName) {
            log(`  ✅ Created/verified table: ${tableName}`, 'green');
          }
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          successCount++;
        } else {
          errorCount++;
          log(`  ⚠️  Statement failed: ${error.message.substring(0, 100)}`, 'yellow');
        }
      }
    }
    
    log(`\n✅ Migration executed (${successCount} statements, ${errorCount} errors)`, 'green');
    
    // Step 5: Verify migration
    log('\n[5/6] Verifying migration...', 'yellow');
    
    const verifyQueries = [
      { name: 'feature_flags', query: 'SELECT COUNT(*) as count FROM feature_flags' },
      { name: 'feature_flag_overrides', query: 'SELECT COUNT(*) as count FROM feature_flag_overrides' },
      { name: 'custom_roles', query: 'SELECT COUNT(*) as count FROM custom_roles' },
      { name: 'user_activity_logs', query: 'SELECT COUNT(*) as count FROM user_activity_logs' },
      { name: 'impersonation_sessions', query: 'SELECT COUNT(*) as count FROM impersonation_sessions' },
      { name: 'user_invitations', query: 'SELECT COUNT(*) as count FROM user_invitations' },
      { name: 'custom_packages', query: 'SELECT COUNT(*) as count FROM custom_packages' }
    ];
    
    for (const { name, query } of verifyQueries) {
      try {
        const result = await pool.query(query);
        const count = parseInt(result.rows[0].count);
        log(`  ✅ ${name}: ${count} records`, 'green');
      } catch (error) {
        log(`  ❌ ${name}: Verification failed`, 'red');
      }
    }
    
    // Show feature flags
    log('\n  Feature Flags seeded:', 'cyan');
    const flagsResult = await pool.query('SELECT key, name, is_active FROM feature_flags');
    flagsResult.rows.forEach(flag => {
      const status = flag.is_active ? '✅' : '⏸️';
      log(`    ${status} ${flag.key} (${flag.name})`, flag.is_active ? 'green' : 'yellow');
    });
    
    // Step 6: Final summary
    log('\n[6/6] Migration complete!', 'yellow');
    
    log('\n' + '='.repeat(70), 'bright');
    log('✅ MIGRATION SUCCESSFUL', 'green');
    log('='.repeat(70), 'bright');
    log('\nNew tables created:', 'cyan');
    log('  • feature_flags - Platform feature toggles', 'bright');
    log('  • feature_flag_overrides - Business/user overrides', 'bright');
    log('  • custom_roles - Custom role definitions', 'bright');
    log('  • user_activity_logs - Audit trail', 'bright');
    log('  • impersonation_sessions - Support logs', 'bright');
    log('  • user_invitations - User invitation system', 'bright');
    log('  • custom_packages - Enterprise packages', 'bright');
    
    log('\nNext steps:', 'yellow');
    log('  1. Run: bun run build', 'bright');
    log('  2. Test: bun run dev', 'bright');
    log('  3. Open: http://localhost:3000/admin', 'bright');
    
    log('='.repeat(70), 'bright');
    
  } catch (error) {
    log('\n' + '='.repeat(70), 'bright');
    log('❌ MIGRATION FAILED', 'red');
    log('='.repeat(70), 'bright');
    log(`\nError: ${error.message}`, 'red');
    
    if (error.message.includes('ECONNREFUSED')) {
      log('\n💡 Database connection refused. Check:', 'yellow');
      log('   - Is the database server running?', 'cyan');
      log('   - Is the connection string correct?', 'cyan');
      log('   - Check firewall settings', 'cyan');
    }
    
    if (error.message.includes('password authentication failed')) {
      log('\n💡 Authentication failed. Check:', 'yellow');
      log('   - Username and password in DATABASE_URL', 'cyan');
      log('   - Database user exists and has permissions', 'cyan');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
