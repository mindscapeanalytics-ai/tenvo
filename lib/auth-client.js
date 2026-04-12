import { createAuthClient } from "better-auth/react";
import { adminClient, lastLoginMethodClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";

const configuredAuthUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;

export const authClient = createAuthClient({
    baseURL: configuredAuthUrl || runtimeOrigin || "http://localhost:3000",
    plugins: [
        adminClient(),
        usernameClient(),
        twoFactorClient(),
        lastLoginMethodClient()
    ]
});

export const { signIn, signUp, signOut, useSession } = authClient;
