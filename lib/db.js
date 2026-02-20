import 'server-only';
import { Pool } from 'pg';

// Optimized connection pool for enterprise load
const globalForDb = global;

const pool = globalForDb.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Enterprise pool settings
    max: 30,                   // Increased for higher concurrent load
    idleTimeoutMillis: 30000,   // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // Increased to 5s to prevent flakiness
    maxUses: 7500,             // Close and replace connection after 7500 uses to prevent memory leaks
});

if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

// Helper for debugging pool exhaustion
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export default pool;
