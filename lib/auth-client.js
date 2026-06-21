import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, lastLoginMethodClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";

const configuredAuthUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

/** In the browser, always use the current origin so API calls match OAuth cookies (localhost vs 127.0.0.1). */
function resolveClientAuthBaseURL() {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    const fromEnv = configuredAuthUrl || "http://localhost:3000";
    return fromEnv.replace(/\/$/, "");
}

export const authClient = createAuthClient({
    baseURL: resolveClientAuthBaseURL(),
    plugins: [
        adminClient(),
        usernameClient(),
        emailOTPClient(),
        twoFactorClient(),
        lastLoginMethodClient()
    ]
});

export const { signIn, signUp, signOut, useSession } = authClient;
