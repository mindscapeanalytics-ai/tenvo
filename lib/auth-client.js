import { createAuthClient } from "better-auth/react";
import { adminClient, lastLoginMethodClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    plugins: [
        adminClient(),
        usernameClient(),
        twoFactorClient(),
        lastLoginMethodClient()
    ]
});

export const { signIn, signUp, signOut, useSession } = authClient;
