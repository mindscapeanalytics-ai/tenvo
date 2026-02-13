import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { admin, lastLoginMethod, twoFactor, username } from "better-auth/plugins";

// Singleton pattern for BetterAuth to avoid redundant initialization in development
const globalForAuth = global;

const auth = globalForAuth.auth || betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin(),
        username(),
        twoFactor(),
        lastLoginMethod({
            storeInDatabase: true
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    globalForAuth.auth = auth;
} else {
    // Audit log for production initialization
    console.log("Tenvo Intelligence: Initializing BetterAuth Core");
}

export { auth };
