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
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120);
const AUTH_RATE_LIMIT_MAX_REQUESTS = Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20);
const ACTION_RATE_LIMIT_MAX_REQUESTS = Number(process.env.ACTION_RATE_LIMIT_MAX_REQUESTS || 80);
const ENABLE_SERVER_ACTION_RATE_LIMIT = process.env.NODE_ENV === 'production';

// ─── Rate Limiting State ───────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(key: string, maxRequests: number): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > maxRequests;
}

function getClientKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = request.headers.get('x-real-ip')?.trim();
    const cfIp = request.headers.get('cf-connecting-ip')?.trim();
    const ip = forwarded || realIp || cfIp;
    if (ip) return ip;

    const ua = request.headers.get('user-agent') || 'unknown-ua';
    const sessionHint = request.cookies.get(SESSION_COOKIE_NAME)?.value ||
        request.cookies.get(SECURE_SESSION_COOKIE_NAME)?.value ||
        'anon';

    return `${ua.slice(0, 80)}:${sessionHint.slice(0, 24)}`;
}

// Cleanup interval (standard singleton pattern for edge)
if (typeof globalThis !== 'undefined') {
    const CLEANUP_INTERVAL = 5 * 60 * 1000;
    const cleanupKey = '__proxy_cleanup_initialized__';
    const globalScope = globalThis as typeof globalThis & { [key: string]: boolean | undefined };
    if (!globalScope[cleanupKey]) {
        globalScope[cleanupKey] = true;
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
    '/api/health'
]);

const AUTH_ROUTES = new Set(['/login', '/signup', '/register']);

// ─── Main Proxy Export ──────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const clientKey = getClientKey(request);
    const isServerAction = request.method === 'POST' && request.headers.has('next-action');

    // 0. Auth endpoint rate limiting (brute-force protection)
    if (pathname.startsWith('/api/auth')) {
        const authKey = `auth:${clientKey}`;
        if (isRateLimited(authKey, AUTH_RATE_LIMIT_MAX_REQUESTS)) {
            return new NextResponse(JSON.stringify({ error: 'Too many authentication attempts' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId }
            });
        }
        return NextResponse.next();
    }

    // 1. API and Server Action Rate Limiting
    if (pathname.startsWith('/api/')) {
        const key = `api:${clientKey}:${pathname}`;
        if (isRateLimited(key, RATE_LIMIT_MAX_REQUESTS)) {
            return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId }
            });
        }
    }

    if (isServerAction && ENABLE_SERVER_ACTION_RATE_LIMIT) {
        const actionId = request.headers.get('next-action') || 'unknown-action';
        const actionKey = `action:${clientKey}:${pathname}:${actionId}`;
        if (isRateLimited(actionKey, ACTION_RATE_LIMIT_MAX_REQUESTS)) {
            return new NextResponse('Too many server action requests', {
                status: 429,
                headers: { 'X-Request-Id': requestId }
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
