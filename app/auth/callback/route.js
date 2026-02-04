import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/auth/confirmed'

    if (code) {
        const cookieStore = {
            getAll() { return [] },
            setAll() { }
        } // Minimal mock - actual cookie handling in middleware/actions ideally, but here we just need exchange

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        // Need to properly parse request cookies in route handler
                        return [] // Simplified for now as exchange mainly sets cookies on response
                    },
                    setAll(cookiesToSet) {
                        // Will be handled by creating response
                    },
                },
            }
        )

        // We use a slightly different approach for Route Handlers to properly set cookies
        // Using the official pattern:
        const response = NextResponse.redirect(`${origin}${next}`)

        const supabaseResponse = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        // Get all cookies from request
                        const cookieHeader = request.headers.get('cookie') || ''
                        return cookieHeader.split(';').map(c => {
                            const [name, ...v] = c.split('=')
                            return { name: name?.trim(), value: v.join('=')?.trim() }
                        })
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { error } = await supabaseResponse.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
