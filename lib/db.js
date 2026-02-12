import { Pool } from 'pg';

// Optimized connection pool for enterprise load
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Enterprise pool settings
    max: 20,                   // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,   // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection
    maxUses: 7500,             // Close and replace connection after 7500 uses to prevent memory leaks
});

// Helper for debugging pool exhaustion
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export default pool;
