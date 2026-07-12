#!/usr/bin/env node
/**
 * Schema Wiring Audit
 * Comprehensive audit of database schema vs code usage
 * Identifies missing columns, naming conflicts, and wiring issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schema definitions from Prisma schema
const SCHEMA_TABLES = {
  storefront_orders: {
    columns: [
      'id', 'business_id', 'order_number', 'customer_email', 'customer_phone',
      'customer_name', 'shipping_address', 'billing_address', 'subtotal',
      'tax_amount', 'shipping_amount', 'discount_amount', 'total_amount',
      'currency', 'status', 'payment_status', 'fulfillment_status', 'notes',
      'metadata', 'created_at', 'updated_at'
    ],
    uniqueConstraints: [
      ['business_id', 'order_number']
    ]
  },
  storefront_order_items: {
    columns: [
      'id', 'order_id', 'business_id', 'product_id', 'product_name',
      'product_sku', 'variant_id', 'quantity', 'unit_price', 'tax_amount',
      'total_price', 'metadata'
    ],
    foreignKeys: [
      { column: 'order_id', references: 'storefront_orders.id' },
      { column: 'business_id', references: 'businesses.id' }
    ]
  },
  products: {
    columns: [
      'id', 'business_id', 'name', 'sku', 'barcode', 'description',
      'category', 'brand', 'price', 'cost_price', 'mrp', 'stock',
      'min_stock', 'min_stock_level', 'max_stock', 'reorder_point',
      'reorder_quantity', 'unit', 'hsn_code', 'sac_code', 'tax_percent',
      'image_url', 'is_active', 'domain_data', 'batches', 'serial_numbers',
      'variants', 'embedding', 'expiry_date', 'manufacturing_date',
      'created_at', 'updated_at', 'batch_number', 'location',
      'unit_conversions', 'is_deleted', 'deleted_at', 'slug',
      'compare_price', 'is_featured', 'is_new', 'stock_status',
      'sales_count', 'images', 'has_variants', 'rating', 'review_count',
      'enable_reviews', 'category_id'
    ],
    softDelete: true
  },
  product_variants: {
    columns: [
      'id', 'business_id', 'product_id', 'variant_sku', 'variant_name',
      'size', 'color', 'pattern', 'material', 'custom_attributes',
      'price', 'cost_price', 'mrp', 'stock', 'min_stock', 'image_url',
      'is_default', 'is_active', 'is_deleted', 'deleted_at',
      'created_at', 'updated_at'
    ],
    softDelete: true
  },
  product_stock_locations: {
    columns: [
      'id', 'business_id', 'product_id', 'warehouse_id', 'quantity',
      'state', 'created_at', 'updated_at'
    ],
    uniqueConstraints: [
      ['business_id', 'product_id', 'warehouse_id', 'state']
    ]
  },
  invoice_payments: {
    columns: [
      'id', 'business_id', 'invoice_id', 'amount', 'payment_method',
      'payment_date', 'reference_number', 'transaction_id',
      'gateway_response', 'notes', 'received_by', 'is_deleted',
      'deleted_at', 'deleted_by', 'created_at', 'updated_at'
    ],
    softDelete: true
  },
  product_serials: {
    columns: [
      'id', 'business_id', 'product_id', 'variant_id', 'serial_number',
      'imei', 'mac_address', 'status', 'purchase_date', 'sale_date',
      'warranty_expiry_date', 'warranty_period_months', 'notes',
      'created_at', 'updated_at', 'batch_id', 'warehouse_id',
      'warranty_start_date', 'warranty_end_date', 'invoice_id',
      'customer_id', 'is_deleted', 'deleted_at'
    ],
    softDelete: true
  }
};

// SQL patterns to search for in code
const SQL_PATTERNS = [
  /INSERT INTO (\w+)\s*\(([^)]+)\)/gi,
  /UPDATE (\w+)\s+SET\s+([^W]+WHERE)/gi,
  /SELECT\s+([^F]+FROM)\s+(\w+)/gi,
  /ALTER TABLE\s+["']?(\w+)["']?\s+ADD COLUMN\s+["']?(\w+)["']?/gi
];

const issues = {
  missingColumns: [],
  extraColumns: [],
  namingConflicts: [],
  missingIndexes: [],
  transactionIssues: [],
  softDeleteIssues: []
};

/**
 * Scan a file for SQL queries and validate against schema
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check for INSERT queries
  const insertMatches = [...content.matchAll(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)/gi)];
  insertMatches.forEach(match => {
    const table = match[1];
    const columns = match[2].split(',').map(c => c.trim().replace(/["'`]/g, ''));
    
    if (SCHEMA_TABLES[table]) {
      const schemaColumns = SCHEMA_TABLES[table].columns;
      const extraCols = columns.filter(c => !schemaColumns.includes(c) && c !== '');
      
      if (extraCols.length > 0) {
        issues.extraColumns.push({
          file: relativePath,
          table,
          columns: extraCols,
          line: getLineNumber(content, match.index)
        });
      }
    }
  });

  // Check for transaction patterns without savepoints
  const transactionMatches = [...content.matchAll(/try\s*\{[^}]*await client\.query\([^)]*INSERT[^}]*\} catch[^}]*await client\.query\([^)]*INSERT/gis)];
  if (transactionMatches.length > 0) {
    const hasSavepoint = content.includes('SAVEPOINT') || content.includes('savepoint');
    if (!hasSavepoint) {
      issues.transactionIssues.push({
        file: relativePath,
        issue: 'try-catch with INSERT retry without SAVEPOINT',
        line: getLineNumber(content, transactionMatches[0].index)
      });
    }
  }

  // Check for soft-delete queries
  Object.entries(SCHEMA_TABLES).forEach(([table, schema]) => {
    if (schema.softDelete) {
      const deleteMatches = [...content.matchAll(new RegExp(`DELETE FROM\\s+${table}`, 'gi'))];
      deleteMatches.forEach(match => {
        issues.softDeleteIssues.push({
          file: relativePath,
          table,
          issue: 'Hard DELETE on soft-delete table - should use UPDATE is_deleted=true',
          line: getLineNumber(content, match.index)
        });
      });

      // Check if queries include is_deleted filter
      const selectMatches = [...content.matchAll(new RegExp(`SELECT[^F]+FROM\\s+${table}[^W]*WHERE`, 'gi'))];
      selectMatches.forEach(match => {
        const queryText = content.substring(match.index, match.index + 500);
        if (!queryText.includes('is_deleted')) {
          issues.softDeleteIssues.push({
            file: relativePath,
            table,
            issue: 'SELECT without is_deleted filter',
            line: getLineNumber(content, match.index)
          });
        }
      });
    }
  });
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Recursively scan directory for JS/TS files
 */
function scanDirectory(dir, excludeDirs = ['node_modules', '.next', '.git', 'dist']) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        scanDirectory(filePath, excludeDirs);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      scanFile(filePath);
    }
  });
}

/**
 * Check for missing migrations
 */
function checkMigrations() {
  console.log('\n📋 Checking migrations...');
  
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  No migrations directory found');
    return;
  }

  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  console.log(`✅ Found ${migrations.length} migrations`);
  
  // Check for critical migrations
  const criticalMigrations = [
    '20260602_storefront_order_items_sku_variant',
    '20260606_invoice_payments_record_payment_columns',
    '20260607_invoice_payments_received_by',
    '20260711_business_settings_id_uuid',
    '20260704_storefront_order_number_unique',
    '20260705_drop_storefront_order_number_global_index'
  ];

  criticalMigrations.forEach(name => {
    const exists = migrations.some(m => m.includes(name));
    if (exists) {
      console.log(`  ✓ ${name}`);
    } else {
      console.log(`  ✗ MISSING: ${name}`);
      issues.missingIndexes.push({
        migration: name,
        severity: 'critical'
      });
    }
  });
}

/**
 * Validate storefront order flow specifically
 */
function validateStorefrontOrderFlow() {
  console.log('\n🛒 Validating storefront order flow...');
  
  const orderRoutePath = path.join(
    process.cwd(),
    'app',
    'api',
    'storefront',
    '[businessDomain]',
    'orders',
    'route.js'
  );

  if (!fs.existsSync(orderRoutePath)) {
    console.log('⚠️  Storefront order route not found');
    return;
  }

  const content = fs.readFileSync(orderRoutePath, 'utf-8');
  
  // Check for SAVEPOINT usage
  const hasSavepoint = content.includes('SAVEPOINT before_line_item_insert');
  const hasRollbackToSavepoint = content.includes('ROLLBACK TO SAVEPOINT');
  
  if (hasSavepoint && hasRollbackToSavepoint) {
    console.log('  ✓ Transaction savepoints properly implemented');
  } else {
    console.log('  ✗ Missing proper savepoint handling');
    issues.transactionIssues.push({
      file: 'app/api/storefront/[businessDomain]/orders/route.js',
      issue: 'Missing SAVEPOINT handling for transaction recovery'
    });
  }

  // Check for proper column references
  const insertMatch = content.match(/INSERT INTO storefront_order_items\s*\(([^)]+)\)/);
  if (insertMatch) {
    const columns = insertMatch[1].split(',').map(c => c.trim());
    const requiredColumns = ['order_id', 'business_id', 'product_id', 'product_name', 'quantity', 'unit_price'];
    const missingRequired = requiredColumns.filter(c => !columns.includes(c));
    
    if (missingRequired.length === 0) {
      console.log('  ✓ All required columns present in INSERT');
    } else {
      console.log(`  ✗ Missing required columns: ${missingRequired.join(', ')}`);
    }
  }
}

/**
 * Main audit function
 */
function runAudit() {
  console.log('🔍 Starting Schema Wiring Audit...\n');
  console.log('═══════════════════════════════════════\n');

  // Check migrations first
  checkMigrations();

  // Validate critical flows
  validateStorefrontOrderFlow();

  // Scan all source files
  console.log('\n📁 Scanning source files...');
  const scanDirs = [
    path.join(process.cwd(), 'app'),
    path.join(process.cwd(), 'lib'),
    path.join(process.cwd(), 'components')
  ];

  scanDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`  Scanning ${path.basename(dir)}/`);
      scanDirectory(dir);
    }
  });

  // Report findings
  console.log('\n═══════════════════════════════════════');
  console.log('📊 AUDIT RESULTS\n');

  let totalIssues = 0;

  if (issues.transactionIssues.length > 0) {
    console.log('🔴 Transaction Issues:');
    issues.transactionIssues.forEach(issue => {
      console.log(`  - ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`    ${issue.issue}`);
      totalIssues++;
    });
    console.log('');
  }

  if (issues.extraColumns.length > 0) {
    console.log('⚠️  Extra Columns (not in schema):');
    issues.extraColumns.forEach(issue => {
      console.log(`  - ${issue.file}:${issue.line}`);
      console.log(`    Table: ${issue.table}`);
      console.log(`    Columns: ${issue.columns.join(', ')}`);
      totalIssues++;
    });
    console.log('');
  }

  if (issues.softDeleteIssues.length > 0) {
    console.log('⚠️  Soft Delete Issues:');
    const grouped = {};
    issues.softDeleteIssues.forEach(issue => {
      const key = issue.table;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    });
    
    Object.entries(grouped).forEach(([table, tableIssues]) => {
      console.log(`  ${table}: ${tableIssues.length} issues`);
      // Show first 3 examples
      tableIssues.slice(0, 3).forEach(issue => {
        console.log(`    - ${issue.file}:${issue.line || '?'} - ${issue.issue}`);
      });
      if (tableIssues.length > 3) {
        console.log(`    ... and ${tableIssues.length - 3} more`);
      }
      totalIssues += tableIssues.length;
    });
    console.log('');
  }

  if (issues.missingIndexes.length > 0) {
    console.log('❌ Missing Critical Migrations:');
    issues.missingIndexes.forEach(issue => {
      console.log(`  - ${issue.migration} (${issue.severity})`);
      totalIssues++;
    });
    console.log('');
  }

  if (totalIssues === 0) {
    console.log('✅ No critical issues found!\n');
  } else {
    console.log(`❌ Total issues found: ${totalIssues}\n`);
  }

  console.log('═══════════════════════════════════════\n');

  // Recommendations
  if (totalIssues > 0) {
    console.log('📋 RECOMMENDATIONS:\n');
    
    if (issues.transactionIssues.length > 0) {
      console.log('1. Fix transaction handling:');
      console.log('   - Use SAVEPOINT before risky queries');
      console.log('   - Use ROLLBACK TO SAVEPOINT on error');
      console.log('   - Use RELEASE SAVEPOINT on success\n');
    }

    if (issues.extraColumns.length > 0) {
      console.log('2. Fix column references:');
      console.log('   - Remove references to non-existent columns');
      console.log('   - Or create migrations to add missing columns\n');
    }

    if (issues.softDeleteIssues.length > 0) {
      console.log('3. Fix soft delete handling:');
      console.log('   - Replace DELETE with UPDATE is_deleted=true');
      console.log('   - Add is_deleted=false filters to queries\n');
    }
  }

  return totalIssues === 0 ? 0 : 1;
}

// Run the audit
const exitCode = runAudit();
process.exit(exitCode);
