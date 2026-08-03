#!/usr/bin/env node

/**
 * Pre-Migration Safety Check
 * Validates environment before running migration
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function check(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

console.log('\n' + '='.repeat(60));
log('PRE-MIGRATION SAFETY CHECK', 'bright');
console.log('='.repeat(60) + '\n');

let allPassed = true;

// Check 1: Node.js version
log('Environment Checks:', 'bright');
try {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major >= 18) {
    log(`✅ Node.js ${version}`, 'green');
  } else {
    log(`⚠️ Node.js ${version} (recommended: 18+)`, 'yellow');
  }
} catch {
  allPassed = false;
}

// Check 2: Bun installed
allPassed = check('bun --version', 'Bun is installed') && allPassed;

// Check 3: PostgreSQL client
allPassed = check('psql --version', 'PostgreSQL client (psql) is installed') && allPassed;

// Check 4: DATABASE_URL
log('\nDatabase Configuration:', 'bright');
if (process.env.DATABASE_URL) {
  log('✅ DATABASE_URL environment variable is set', 'green');
  
  // Test connection
  try {
    execSync(`psql "${process.env.DATABASE_URL}" -c "SELECT 1;"`, { stdio: 'ignore' });
    log('✅ Database connection successful', 'green');
  } catch {
    log('❌ Cannot connect to database', 'red');
    allPassed = false;
  }
} else {
  log('❌ DATABASE_URL not set', 'red');
  allPassed = false;
  log('\nTo fix, run one of these commands:', 'yellow');
  log('  Windows CMD:    set DATABASE_URL=postgresql://...', 'bright');
  log('  Windows Power:  $env:DATABASE_URL="postgresql://..."', 'bright');
  log('  Linux/Mac:      export DATABASE_URL=postgresql://...', 'bright');
}

// Check 5: Migration file exists
log('\nMigration Files:', 'bright');
allPassed = check(
  'test -f scripts/migrations/002_add_admin_features.sql',
  'Migration SQL file exists'
) && allPassed;

// Check 6: Backup directory
log('\nBackup Configuration:', 'bright');
try {
  execSync('mkdir -p backups', { stdio: 'ignore' });
  log('✅ Backups directory ready', 'green');
} catch {
  log('❌ Cannot create backups directory', 'red');
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  log('✅ ALL CHECKS PASSED - Ready for migration', 'green');
  console.log('='.repeat(60));
  log('\nNext: Run the migration', 'bright');
  log('  Windows: scripts\\migrate-windows.bat', 'bright');
  log('  Node.js: node scripts/execute-migration.js', 'bright');
} else {
  log('❌ SOME CHECKS FAILED - Fix issues before migrating', 'red');
  console.log('='.repeat(60));
  process.exit(1);
}
console.log('');
