#!/usr/bin/env node

/**
 * Database Schema Analyzer
 * Comprehensive analysis of all tables, relationships, and gaps
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

async function analyzeSchema() {
  log('\n' + '='.repeat(80), 'bright');
  log('DATABASE SCHEMA ANALYSIS', 'bright');
  log('='.repeat(80), 'bright');
  
  if (!process.env.DATABASE_URL) {
    log('\n❌ DATABASE_URL not set', 'red');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // 1. List all tables
    log('\n[1] DATABASE TABLES', 'bright');
    const tablesResult = await pool.query(`
      SELECT 
        t.tablename,
        pg_size_pretty(pg_total_relation_size('"' || t.tablename || '"')) as size,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as columns
      FROM pg_tables t
      WHERE t.schemaname = 'public'
      ORDER BY pg_total_relation_size('"' || t.tablename || '"') DESC
    `);
    
    log(`\nFound ${tablesResult.rows.length} tables:\n`, 'cyan');
    
    const coreTables = [];
    const adminTables = [];
    const otherTables = [];
    
    for (const table of tablesResult.rows) {
      const name = table.tablename;
      if (['businesses', 'user', 'business_users', 'products', 'invoices', 'customers', 'vendors', 'inventory_transactions'].includes(name)) {
        coreTables.push(table);
      } else if (name.includes('feature') || name.includes('role') || name.includes('impersonat') || name.includes('invitation') || name.includes('package') || name.includes('activity')) {
        adminTables.push(table);
      } else {
        otherTables.push(table);
      }
    }
    
    log('CORE TABLES:', 'yellow');
    coreTables.forEach(t => log(`  ✅ ${t.tablename} (${t.columns} cols, ${t.size})`, 'green'));
    
    log('\nADMIN TABLES:', 'yellow');
    adminTables.forEach(t => log(`  ✅ ${t.tablename} (${t.columns} cols, ${t.size})`, 'green'));
    
    if (otherTables.length > 0) {
      log('\nOTHER TABLES:', 'yellow');
      otherTables.forEach(t => log(`  • ${t.tablename} (${t.columns} cols, ${t.size})`, 'cyan'));
    }
    
    // 2. Analyze foreign key relationships
    log('\n[2] FOREIGN KEY RELATIONSHIPS', 'bright');
    
    const fkResult = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);
    
    log(`\nFound ${fkResult.rows.length} foreign key constraints:\n`, 'cyan');
    
    const relationships = {};
    for (const fk of fkResult.rows) {
      if (!relationships[fk.table_name]) {
        relationships[fk.table_name] = [];
      }
      relationships[fk.table_name].push({
        column: fk.column_name,
        references: `${fk.foreign_table_name}.${fk.foreign_column_name}`
      });
    }
    
    for (const [table, fks] of Object.entries(relationships)) {
      log(`  ${table}:`, 'yellow');
      fks.forEach(fk => {
        log(`    → ${fk.column} references ${fk.references}`, 'cyan');
      });
    }
    
    // 3. Identify tables without foreign keys (potential orphans)
    log('\n[3] TABLES WITHOUT FOREIGN KEYS', 'bright');
    
    const noFkResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT IN (
        SELECT table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
      )
      ORDER BY tablename
    `);
    
    if (noFkResult.rows.length > 0) {
      log(`\n${noFkResult.rows.length} tables have no foreign keys (may need attention):\n`, 'yellow');
      noFkResult.rows.forEach(t => {
        const isCore = ['businesses', 'user'].includes(t.tablename);
        const isNew = ['feature_flags', 'feature_flag_overrides', 'custom_roles', 
                       'user_activity_logs', 'impersonation_sessions', 
                       'user_invitations', 'custom_packages'].includes(t.tablename);
        
        if (isCore) {
          log(`  ⚠️  ${t.tablename} (expected - root table)`, 'cyan');
        } else if (isNew) {
          log(`  ⚠️  ${t.tablename} (NEW - needs FKs!)`, 'red');
        } else {
          log(`  • ${t.tablename}`, 'cyan');
        }
      });
    }
    
    // 4. Check for missing indexes
    log('\n[4] INDEX ANALYSIS', 'bright');
    
    const indexResult = await pool.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    log(`\nFound ${indexResult.rows.length} indexes:\n`, 'cyan');
    
    const tableIndexes = {};
    for (const idx of indexResult.rows) {
      if (!tableIndexes[idx.tablename]) {
        tableIndexes[idx.tablename] = [];
      }
      tableIndexes[idx.tablename].push(idx.indexname);
    }
    
    for (const [table, indexes] of Object.entries(tableIndexes).slice(0, 10)) {
      log(`  ${table}: ${indexes.length} indexes`, 'yellow');
    }
    if (Object.keys(tableIndexes).length > 10) {
      log(`  ... and ${Object.keys(tableIndexes).length - 10} more tables`, 'cyan');
    }
    
    // 5. Check column types and constraints
    log('\n[5] COLUMN TYPE ANALYSIS', 'bright');
    
    const columnResult = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('businesses', 'user', 'business_users', 'products', 'invoices', 
                         'feature_flags', 'feature_flag_overrides', 'custom_roles',
                         'user_activity_logs', 'impersonation_sessions')
      ORDER BY table_name, ordinal_position
    `);
    
    log(`\nAnalyzed ${columnResult.rows.length} columns in key tables\n`, 'cyan');
    
    // 6. Identify potential issues
    log('\n[6] POTENTIAL ISSUES & GAPS', 'bright');
    
    const issues = [];
    
    // Check for missing business_id FKs in new tables
    const newTables = ['feature_flag_overrides', 'custom_roles', 'user_activity_logs', 
                       'impersonation_sessions', 'user_invitations', 'custom_packages'];
    
    for (const table of newTables) {
      const hasBusinessId = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'business_id'
      `, [table]);
      
      if (hasBusinessId.rows.length > 0) {
        const hasFk = await pool.query(`
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 
          AND kcu.column_name = 'business_id'
          AND tc.constraint_type = 'FOREIGN KEY'
        `, [table]);
        
        if (hasFk.rows.length === 0) {
          issues.push({
            table,
            issue: `business_id column exists but no FK to businesses(id)`,
            severity: 'HIGH'
          });
        }
      }
    }
    
    // Check for missing user_id FKs
    for (const table of ['user_activity_logs', 'impersonation_sessions', 'user_invitations', 'custom_roles']) {
      const hasUserId = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name IN ('user_id', 'admin_id', 'target_user_id', 'invited_by', 'created_by')
      `, [table]);
      
      if (hasUserId.rows.length > 0) {
        const hasFk = await pool.query(`
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 
          AND kcu.column_name IN ('user_id', 'admin_id', 'target_user_id', 'invited_by', 'created_by')
          AND tc.constraint_type = 'FOREIGN KEY'
        `, [table]);
        
        if (hasFk.rows.length === 0) {
          issues.push({
            table,
            issue: `user-related column exists but no FK to "user"(id)`,
            severity: 'MEDIUM'
          });
        }
      }
    }
    
    // Check for missing created_at/updated_at
    for (const table of newTables) {
      const hasTimestamps = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1 AND column_name IN ('created_at', 'updated_at')
      `, [table]);
      
      if (hasTimestamps.rows.length < 2) {
        issues.push({
          table,
          issue: `Missing timestamp columns (created_at/updated_at)`,
          severity: 'LOW'
        });
      }
    }
    
    if (issues.length > 0) {
      log(`\nFound ${issues.length} issues:\n`, 'yellow');
      issues.forEach(issue => {
        const color = issue.severity === 'HIGH' ? 'red' : issue.severity === 'MEDIUM' ? 'yellow' : 'cyan';
        log(`  [${issue.severity}] ${issue.table}: ${issue.issue}`, color);
      });
    } else {
      log('\n✅ No major issues found', 'green');
    }
    
    // 7. Generate schema documentation
    log('\n[7] GENERATING SCHEMA DOCUMENTATION', 'bright');
    
    const schemaDoc = {
      generatedAt: new Date().toISOString(),
      database: 'Tenvo ERP',
      tables: tablesResult.rows.map(t => ({
        name: t.tablename,
        columns: parseInt(t.columns),
        size: t.size
      })),
      relationships: relationships,
      issues: issues,
      summary: {
        totalTables: tablesResult.rows.length,
        coreTables: coreTables.length,
        adminTables: adminTables.length,
        foreignKeys: fkResult.rows.length,
        indexes: indexResult.rows.length,
        issuesFound: issues.length
      }
    };
    
    const docPath = path.join('docs', 'schema-analysis.json');
    await fs.writeFile(docPath, JSON.stringify(schemaDoc, null, 2));
    log(`\n✅ Schema documentation saved: ${docPath}`, 'green');
    
    // Final summary
    log('\n' + '='.repeat(80), 'bright');
    log('ANALYSIS COMPLETE', 'bright');
    log('='.repeat(80), 'bright');
    log(`
Summary:
  • Total Tables: ${tablesResult.rows.length}
  • Core Tables: ${coreTables.length}
  • Admin Tables: ${adminTables.length}
  • Foreign Keys: ${fkResult.rows.length}
  • Indexes: ${indexResult.rows.length}
  • Issues Found: ${issues.length}
`, 'cyan');
    
    if (issues.length > 0) {
      log('⚠️  Issues need attention - see above for details', 'yellow');
      log('\nNext: Run schema fixes to resolve issues', 'bright');
    } else {
      log('✅ Schema looks good!', 'green');
    }
    
    log('='.repeat(80), 'bright');
    
  } catch (error) {
    log('\n❌ Analysis failed', 'red');
    log(error.message, 'red');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

analyzeSchema();
