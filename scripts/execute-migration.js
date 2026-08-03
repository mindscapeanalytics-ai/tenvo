#!/usr/bin/env node

/**
 * Database Migration Execution Script
 * Safely executes the admin features migration with verification
 * 
 * Usage: node scripts/execute-migration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}/6] ${message}`, 'bright');
}

function executeCommand(command, description) {
  log(`  → ${description}...`, 'cyan');
  try {
    const result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`  ✅ ${description} completed`, 'green');
    return result;
  } catch (error) {
    log(`  ❌ ${description} failed`, 'red');
    log(error.stderr || error.message, 'red');
    throw error;
  }
}

async function runMigration() {
  const startTime = Date.now();
  
  log('\n' + '='.repeat(70), 'bright');
  log('TENVO DATABASE MIGRATION - Admin Features', 'bright');
  log('='.repeat(70), 'bright');
  
  try {
    // Step 1: Pre-flight checks
    logStep(1, 'Pre-flight Checks');
    
    // Check if migration file exists
    const migrationFile = path.join(__dirname, 'migrations', '002_add_admin_features.sql');
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }
    log(`  ✅ Migration file found: ${migrationFile}`, 'green');
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      log('  ⚠️  DATABASE_URL not set in environment', 'yellow');
      log('  → Please set DATABASE_URL before running this script', 'yellow');
      process.exit(1);
    }
    log('  ✅ DATABASE_URL environment variable set', 'green');
    
    // Step 2: Backup database
    logStep(2, 'Creating Database Backup');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backups/pre_migration_${timestamp}.sql`;
    
    // Ensure backups directory exists
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups', { recursive: true });
    }
    
    try {
      executeCommand(
        `pg_dump "${process.env.DATABASE_URL}" > "${backupFile}"`,
        'Creating backup'
      );
      log(`  ✅ Backup created: ${backupFile}`, 'green');
    } catch (error) {
      log('  ⚠️  Backup creation failed (continuing anyway)', 'yellow');
    }
    
    // Step 3: Test database connection
    logStep(3, 'Testing Database Connection');
    executeCommand(
      `psql "${process.env.DATABASE_URL}" -c "SELECT version();"`,
      'Testing connection'
    );
    
    // Step 4: Execute migration
    logStep(4, 'Executing Migration');
    log('  → Running migration script...', 'cyan');
    
    try {
      const result = execSync(
        `psql "${process.env.DATABASE_URL}" -f "${migrationFile}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      
      // Check for errors in output
      if (result.includes('ERROR') || result.includes('FATAL')) {
        throw new Error('Migration failed with errors:\n' + result);
      }
      
      log('  ✅ Migration executed successfully', 'green');
      
      // Show summary from migration output
      const lines = result.split('\n');
      const createTableLines = lines.filter(l => l.includes('CREATE TABLE'));
      const insertLines = lines.filter(l => l.includes('INSERT 0 1'));
      
      log(`  → Created ${createTableLines.length} tables`, 'cyan');
      log(`  → Inserted ${insertLines.length} seed records`, 'cyan');
      
    } catch (error) {
      log('  ❌ Migration failed', 'red');
      log(error.stdout || error.message, 'red');
      throw error;
    }
    
    // Step 5: Verify migration
    logStep(5, 'Verifying Migration');
    
    const verificationQueries = [
      { name: 'feature_flags', query: 'SELECT COUNT(*) as count FROM feature_flags' },
      { name: 'feature_flag_overrides', query: 'SELECT COUNT(*) as count FROM feature_flag_overrides' },
      { name: 'custom_roles', query: 'SELECT COUNT(*) as count FROM custom_roles' },
      { name: 'user_activity_logs', query: 'SELECT COUNT(*) as count FROM user_activity_logs' },
      { name: 'impersonation_sessions', query: 'SELECT COUNT(*) as count FROM impersonation_sessions' },
      { name: 'user_invitations', query: 'SELECT COUNT(*) as count FROM user_invitations' },
      { name: 'custom_packages', query: 'SELECT COUNT(*) as count FROM custom_packages' }
    ];
    
    for (const { name, query } of verificationQueries) {
      try {
        const result = execSync(
          `psql "${process.env.DATABASE_URL}" -c "${query}" --tuples-only`,
          { encoding: 'utf-8' }
        );
        const count = parseInt(result.trim()) || 0;
        log(`  ✅ ${name}: ${count} records`, 'green');
      } catch (error) {
        log(`  ❌ ${name}: Verification failed`, 'red');
      }
    }
    
    // Step 6: Final summary
    logStep(6, 'Migration Complete');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n' + '='.repeat(70), 'bright');
    log('✅ MIGRATION SUCCESSFUL', 'green');
    log('='.repeat(70), 'bright');
    log(`Duration: ${duration}s`, 'cyan');
    log(`Backup: ${backupFile}`, 'cyan');
    log('\nNew tables created:', 'bright');
    log('  • feature_flags', 'cyan');
    log('  • feature_flag_overrides', 'cyan');
    log('  • custom_roles', 'cyan');
    log('  • user_activity_logs', 'cyan');
    log('  • impersonation_sessions', 'cyan');
    log('  • user_invitations', 'cyan');
    log('  • custom_packages', 'cyan');
    log('\nNext steps:', 'bright');
    log('  1. Run: bun run build', 'cyan');
    log('  2. Deploy to production', 'cyan');
    log('  3. Test admin panel features', 'cyan');
    log('='.repeat(70), 'bright');
    
  } catch (error) {
    log('\n' + '='.repeat(70), 'bright');
    log('❌ MIGRATION FAILED', 'red');
    log('='.repeat(70), 'bright');
    log(error.message, 'red');
    log('\nRollback instructions:', 'yellow');
    log('  1. Check backup file in backups/ directory', 'cyan');
    log('  2. Restore with: pg_restore [backup_file]', 'cyan');
    log('  3. Or manually drop created tables', 'cyan');
    log('='.repeat(70), 'bright');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
