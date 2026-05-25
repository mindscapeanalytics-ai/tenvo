import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { admin, lastLoginMethod, twoFactor, username } from "better-auth/plugins";

// Singleton pattern — one BetterAuth instance per process.
// Uses the shared Prisma instance from db.js to avoid creating a second connection pool.
const globalForAuth = global;

const auth = globalForAuth.auth ?? betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development-change-in-production",
    plugins: [
        admin(),
        username(),
        twoFactor(),
        lastLoginMethod({
            storeInDatabase: true
        })
    ]
});

// Cache in all environments — module cache handles this in production,
// but the explicit global guard prevents duplicate instances during hot-reload in dev.
globalForAuth.auth = auth;

export { auth };
