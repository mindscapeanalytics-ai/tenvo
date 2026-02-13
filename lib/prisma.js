import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global

const prisma = globalForPrisma.prisma || (() => {
    const pool = globalForPrisma.pgPool || new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        // Enterprise pool settings
        max: 20,                   // Maximum number of connections in the pool
        idleTimeoutMillis: 30000,   // How long a client is allowed to remain idle
        connectionTimeoutMillis: 2000, // How long to wait for a connection
        maxUses: 7500,             // prevent memory leaks
    })

    if (process.env.NODE_ENV !== 'production') globalForPrisma.pgPool = pool

    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
