import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prismaBase } from "./db";
import { admin, emailOTP, lastLoginMethod, twoFactor, username } from "better-auth/plugins";
import { isValidStoreHandleUsername } from "./auth/store-handle-validator";

function resolveBetterAuthSecret() {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
        if (!secret || secret.length < 32) {
            throw new Error(
                "BETTER_AUTH_SECRET must be set in production to a random string of at least 32 characters."
            );
        }
        return secret;
    }
    return secret || "dev-only-better-auth-secret-not-for-production";
}

/** Server-side canonical URL for OAuth callbacks and emailed links (no trailing slash). */
function resolveAuthBaseURL() {
    const direct = process.env.BETTER_AUTH_URL?.trim();
    if (direct) return direct.replace(/\/$/, "");
    const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (app) return app.replace(/\/$/, "");
    const pub = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
    if (pub) return pub.replace(/\/$/, "");
    return undefined;
}

/**
 * Better Auth `baseURL`: a string, or a dynamic config when `BETTER_AUTH_ALLOWED_HOSTS` is set
 * (comma-separated `host:port` values). The OAuth redirect_uri is derived from the incoming
 * request host when dynamic mode is active — avoids `redirect_uri_mismatch` if you open the app
 * via `127.0.0.1` while `BETTER_AUTH_URL` only listed `localhost`. Add every host you use to
 * Google Cloud Console → Authorized redirect URIs: `https://<host>/api/auth/callback/google`.
 */
function resolveBetterAuthBaseURLOption() {
    const staticBase = resolveAuthBaseURL();
    const raw = process.env.BETTER_AUTH_ALLOWED_HOSTS?.trim();
    if (!raw) return staticBase;

    const allowedHosts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (allowedHosts.length === 0) return staticBase;

    return {
        allowedHosts,
        fallback: staticBase || "http://localhost:3000",
    };
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleOAuthEnabled = Boolean(googleClientId && googleClientSecret);

// Singleton pattern — one BetterAuth instance per process.
// Uses Prisma **without** tenant query extension so auth tables are never auto-filtered.
const globalForAuth = global;

const auth = globalForAuth.auth ?? betterAuth({
    baseURL: resolveBetterAuthBaseURLOption(),
    database: prismaAdapter(prismaBase, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    secret: resolveBetterAuthSecret(),
    ...(googleOAuthEnabled
        ? {
              socialProviders: {
                  google: {
                      clientId: googleClientId,
                      clientSecret: googleClientSecret,
                      prompt: "select_account",
                  },
              },
          }
        : {}),
    plugins: [
        admin(),
        username({
            // Registration uses URL-style slugs (hyphens); Better Auth default allows only [a-zA-Z0-9_.]
            minUsernameLength: 3,
            maxUsernameLength: 63,
            usernameValidator: (u) => isValidStoreHandleUsername(u),
        }),
        twoFactor(),
        lastLoginMethod({
            storeInDatabase: true
        }),
        emailOTP({
            otpLength: 6,
            expiresIn: 600,
            async sendVerificationOTP({ email, otp, type }) {
                const { sendAuthOtpEmail } = await import("@/lib/auth/sendAuthOtpEmail.jsx");
                await sendAuthOtpEmail({ email, otp, type });
            },
        }),
    ]
});

// Cache in all environments — module cache handles this in production,
// but the explicit global guard prevents duplicate instances during hot-reload in dev.
globalForAuth.auth = auth;

export { auth };
