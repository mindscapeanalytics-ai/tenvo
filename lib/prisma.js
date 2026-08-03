/**
 * Prisma singleton — re-exports the shared instance from db.js.
 *
 * Both db.js and this file previously created separate PrismaClient instances
 * that both wrote to global.prisma, causing them to overwrite each other in
 * development and create two separate instances in production (wasting connections).
 *
 * The single source of truth is db.js which owns the pg Pool and the PrismaClient
 * built on top of it. This file simply re-exports that instance so existing
 * imports of '@/lib/prisma' continue to work without change.
 */
import { db } from './db';

export default db;
