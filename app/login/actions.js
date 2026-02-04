'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import pool from '@/lib/db';

/**
 * Server Action: Login with Better Auth
 * Replaces Supabase auth login
 */
export async function login(formData) {
    const { email, password } = formData;

    try {
        // Sign in with Better Auth
        const signInResult = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
            headers: await headers(),
        });

        if (!signInResult || signInResult.error) {
            return {
                error: signInResult?.error?.message || 'Invalid email or password.'
            };
        }

        // Get session to verify login
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return { error: 'Authentication failed. Please try again.' };
        }

        const userId = session.user.id;
        let redirectPath = '/register';

        // Query business membership using pg pool
        const client = await pool.connect();
        try {
            // Get user's active business membership
            const membershipResult = await client.query(`
                SELECT business_id, role 
                FROM business_users 
                WHERE user_id = $1 AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
            `, [userId]);

            if (membershipResult.rows.length > 0) {
                const { business_id } = membershipResult.rows[0];

                // Get business domain
                const businessResult = await client.query(`
                    SELECT domain 
                    FROM businesses 
                    WHERE id = $1
                `, [business_id]);

                if (businessResult.rows.length > 0) {
                    const { domain } = businessResult.rows[0];
                    redirectPath = `/business/${domain}`;
                }
            } else {
                console.warn('User authenticated but no active business membership found.');
                // User needs to complete registration
                redirectPath = '/register';
            }
        } finally {
            client.release();
        }

        redirect(redirectPath);

    } catch (error) {
        console.error('Login error:', error);
        return {
            error: error.message || 'An error occurred during login.'
        };
    }
}
