import 'server-only';
import fs from 'fs';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createTenantExtension } from '@/lib/prisma/tenantExtension';

const globalForDb = global;

/**
 * Postgres `ssl` option for `pg.Pool` (used by Prisma adapter + Better Auth).
 * - Local URLs (no TLS hints): SSL off.
 * - Hosted / sslmode hints: TLS on. Without a custom CA, **strict** verify often fails with
 *   P1011 ("self-signed certificate in certificate chain") for poolers, proxies, or dev DBs.
 * - DATABASE_SSL_STRICT=true or sslmode=verify-full: verify server cert (needs public CA or DATABASE_SSL_CA_PATH).
 * - DATABASE_SSL_CA_PATH: PEM bundle + verify.
 * - DATABASE_SSL_INSECURE=true or sslmode=no-verify: same as default relaxed mode (explicit escape hatch).
 */
function getPoolSsl() {
  if (!process.env.DATABASE_URL) return false;
  if (process.env.DATABASE_SSL_DISABLE === 'true') return false;

  const url = process.env.DATABASE_URL.toLowerCase();
  const useTls =
    url.includes('sslmode=require') ||
    url.includes('sslmode=verify-full') ||
    url.includes('sslmode=no-verify') ||
    url.includes('.neon.tech') ||
    url.includes('supabase.co') ||
    url.includes('amazonaws.com') ||
    Boolean(process.env.DATABASE_SSL_CA_PATH);

  if (!useTls) return false;

  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (caPath) {
    try {
      const ca = fs.readFileSync(caPath, 'utf8');
      return { rejectUnauthorized: true, ca };
    } catch (e) {
      console.error('[db] Failed to read DATABASE_SSL_CA_PATH:', caPath, e);
      throw e;
    }
  }

  const wantStrictVerify =
    process.env.DATABASE_SSL_STRICT === 'true' || url.includes('sslmode=verify-full');

  if (wantStrictVerify) {
    return { rejectUnauthorized: true };
  }

  // Default: encrypt without pinning CA (avoids P1011 for self-signed / unknown intermediates).
  // Set DATABASE_SSL_STRICT=true in production when the server uses a publicly trusted chain only.
  return { rejectUnauthorized: false };
}

/**
 * Shared pool options for both primary and read pools.
 * Tuned for multi-tenant SaaS workloads:
 * - Higher default max (30) to handle concurrent tenant operations
 * - statement_timeout prevents runaway queries from blocking the pool
 * - idle timeout aggressively reclaims unused connections
 * - maxUses prevents connection-level memory leaks in long-running Node processes
 */
function getPoolConfig(connectionString) {
  return {
    connectionString: connectionString || 'postgresql://dummy:dummy@localhost:5432/dummy',
    ssl: getPoolSsl(),
    max: Number(process.env.PG_POOL_MAX) > 0 ? Number(process.env.PG_POOL_MAX) : 30,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: Number(process.env.PG_POOL_CONNECT_TIMEOUT_MS) > 0
      ? Number(process.env.PG_POOL_CONNECT_TIMEOUT_MS)
      : 15000,
    maxUses: 7500,
    // Prevent runaway queries from blocking the pool (30s default, override via env)
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS) > 0
      ? Number(process.env.PG_STATEMENT_TIMEOUT_MS)
      : 30000,
    application_name: 'tenvo-app',
  };
}

// ── Primary write pool ───────────────────────────────────────────────
const pool =
  globalForDb.pgPool ||
  new Pool(getPoolConfig(process.env.DATABASE_URL));

if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

// ── Read replica pool (optional — falls back to primary) ─────────────
// Set DATABASE_READ_URL to a read replica endpoint for read scaling.
// When not configured, readPool === pool (no code changes needed downstream).
const readPool =
  globalForDb.pgReadPool ||
  (process.env.DATABASE_READ_URL
    ? new Pool(getPoolConfig(process.env.DATABASE_READ_URL))
    : pool);

if (process.env.NODE_ENV !== 'production') globalForDb.pgReadPool = readPool;

function getPrismaBaseInstance() {
  if (process.env.NODE_ENV !== 'production' && globalForDb.prismaBase && !globalForDb.prismaBase.water_delivery_stops) {
    delete globalForDb.prismaBase;
    delete globalForDb.prisma;
  }
  if (!globalForDb.prismaBase) {
    const adapter = new PrismaPg(pool);
    globalForDb.prismaBase = new PrismaClient({ adapter });
  }
  return globalForDb.prismaBase;
}

function getDbInstance() {
  const base = getPrismaBaseInstance();
  if (!globalForDb.prisma) {
    globalForDb.prisma = base.$extends(createTenantExtension());
  }
  return globalForDb.prisma;
}

const prismaBase = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getPrismaBaseInstance();
      const value = Reflect.get(instance, prop);
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    },
    has(_target, prop) {
      return Reflect.has(getPrismaBaseInstance(), prop);
    },
  }
);

const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getDbInstance();
      const value = Reflect.get(instance, prop);
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    },
    has(_target, prop) {
      return Reflect.has(getDbInstance(), prop);
    },
  }
);

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client (write pool)', err);
});

if (readPool !== pool) {
  readPool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client (read pool)', err);
  });
}

export { pool, readPool, db, prismaBase };
export { withBusinessContext, getTenantBusinessId } from '@/lib/prisma/tenantExtension';
export default pool;