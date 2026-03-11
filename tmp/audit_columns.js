const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connection from lib/db.js environment
const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function audit() {
    console.log('--- STARTING DATABASE AUDIT ---');

    // 1. Get DB Schema
    const dbColumnsRes = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name;
  `);

    const dbSchema = {};
    dbColumnsRes.rows.forEach(row => {
        if (!dbSchema[row.table_name]) dbSchema[row.table_name] = [];
        dbSchema[row.table_name].push(row.column_name);
    });

    // 2. Get Prisma Schema
    const prismaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const prismaContent = fs.readFileSync(prismaPath, 'utf8');

    const prismaSchema = {};
    let currentModel = null;
    prismaContent.split('\n').forEach(line => {
        const modelMatch = line.match(/^\s*model\s+(\w+)\s+\{/);
        if (modelMatch) {
            currentModel = modelMatch[1];
            prismaSchema[currentModel] = [];
        } else if (currentModel && line.match(/^\s*\}/)) {
            currentModel = null;
        } else if (currentModel) {
            const fieldMatch = line.match(/^\s*(\w+)\s+/);
            if (fieldMatch) {
                prismaSchema[currentModel].push(fieldMatch[1]);
            }
        }
    });

    // 3. Compare DB vs Prisma
    console.log('\n--- DB vs PRISMA MISMATCHES ---');
    const allTables = new Set([...Object.keys(dbSchema), ...Object.keys(prismaSchema)]);
    allTables.forEach(table => {
        if (!dbSchema[table]) {
            // Ignore views or internal prisma tables
            if (table.startsWith('_')) return;
            console.log(`[!] Table ${table} exists in Prisma but NOT in DB`);
            return;
        }
        if (!prismaSchema[table]) {
            if (table.startsWith('_') || table === 'knex_migrations') return;
            console.log(`[!] Table ${table} exists in DB but NOT in Prisma`);
            return;
        }

        const dbCols = dbSchema[table];
        const prismaCols = prismaSchema[table];

        const missingInDb = prismaCols.filter(c => !dbCols.includes(c));
        const extraInDb = dbCols.filter(c => !prismaCols.includes(c));

        if (missingInDb.length > 0) console.log(`[!] Table ${table}: Columns in Prisma but MISSING in DB: ${missingInDb.join(', ')}`);
        if (extraInDb.length > 0) console.log(`[!] Table ${table}: Columns in DB but MISSING in Prisma: ${extraInDb.join(', ')}`);
    });

    console.log('\n--- AUDIT COMPLETE ---');
    process.exit(0);
}

audit().catch(err => {
    console.error(err);
    process.exit(1);
});
