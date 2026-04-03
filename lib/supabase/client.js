/**
 * Supabase Client for Browser/Client-Side Usage
 * 
 * This module provides a Supabase client instance configured for use in
 * React components and client-side code. It uses the @supabase/ssr package
 * for proper cookie handling in Next.js.
 * 
 * @module lib/supabase/client
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create and return a Supabase client instance for browser use
 * 
 * This function creates a new Supabase client configured with:
 * - Automatic cookie management
 * - Proper authentication state handling
 * - Real-time subscription support
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient} Supabase client instance
 * 
 * @example
 * import { createClient } from '@/lib/supabase/client';
 * 
 * const supabase = createClient();
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .eq('business_id', businessId);
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
