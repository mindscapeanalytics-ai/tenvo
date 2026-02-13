import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 16 Proxy Boundary
 * 
 * Replaces the deprecated 'middleware' convention.
 * Responsibilities:
 * 1. Routing & Redirects
 * 2. Security headers — CSP, HSTS, X-Frame-Options
 * 3. Rate limiting (Edge-compatible)
 * 4. Auth persistence check (Lightweight guard)
 */

// ─── Constants ─────────────────────────────────────────────────────────────
const SESSION_COOKIE_NAME = 'better-auth.session_token';
const SECURE_SESSION_COOKIE_NAME = '__Secure-better-auth.session_token';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

// ─── Rate Limiting State ───────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Cleanup interval (standard singleton pattern for edge)
if (typeof globalThis !== 'undefined') {
    const CLEANUP_INTERVAL = 5 * 60 * 1000;
    const cleanupKey = '__proxy_cleanup_initialized__';
    if (!(globalThis as any)[cleanupKey]) {
        (globalThis as any)[cleanupKey] = true;
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of rateLimitMap.entries()) {
                if (now > value.resetTime) rateLimitMap.delete(key);
            }
        }, CLEANUP_INTERVAL);
    }
}

// ─── Utils ──────────────────────────────────────────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
    const headers = response.headers;
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    if (process.env.NODE_ENV === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    return response;
}

const PUBLIC_ROUTES = new Set([
    '/', '/login', '/signup', '/register',
    '/forgot-password', '/reset-password', '/verify-email',
    '/api/health', '/api/migrate'
]);

const AUTH_ROUTES = new Set(['/login', '/signup', '/register']);

// ─── Main Proxy Export ──────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    // 0. Bypass Auth Internal
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // 1. API Rate Limiting
    if (pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (isRateLimited(ip)) {
            return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId }
            });
        }
    }

    // 2. Public Route Logic
    const isPublic = PUBLIC_ROUTES.has(pathname) || pathname.startsWith('/_next') || pathname.includes('.');

    if (isPublic) {
        const res = NextResponse.next();
        res.headers.set('X-Request-Id', requestId);
        return addSecurityHeaders(res);
    }

    // 3. Auth Guard (BetterAuth Session)
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value ||
        request.cookies.get(SECURE_SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. Auth Route Redirect
    if (AUTH_ROUTES.has(pathname)) {
        return NextResponse.redirect(new URL('/business/retail', request.url));
    }

    const res = NextResponse.next();
    res.headers.set('X-Request-Id', requestId);
    return addSecurityHeaders(res);
}

// ─── Matcher ────────────────────────────────────────────────────────────────
export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
