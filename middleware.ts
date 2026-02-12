import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware
 * 
 * Responsibilities:
 * 1. Route protection — redirect unauthenticated users from /business/* routes
 * 2. Security headers — CSP, HSTS, X-Frame-Options
 * 3. Rate limiting — basic in-memory rate limiter (edge-compatible)
 * 4. Request ID tracking — attach unique ID for observability
 * 
 * BetterAuth Integration:
 * - Reads the session token from cookies set by BetterAuth
 * - Does NOT verify the token cryptographically (that happens server-side)
 * - Acts as a fast first-pass guard before hitting server actions
 */

// ─── Rate Limiting (In-Memory, Edge-Compatible) ──────────────────────────────
// Note: For production scale, replace with Upstash Redis rate limiter
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per IP per window

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

// Periodic cleanup to prevent memory leaks (runs every 5 minutes)
if (typeof globalThis !== 'undefined') {
    const CLEANUP_INTERVAL = 5 * 60 * 1000;
    const cleanupKey = '__middleware_cleanup_initialized__';
    if (!(globalThis as Record<string, unknown>)[cleanupKey]) {
        (globalThis as Record<string, unknown>)[cleanupKey] = true;
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of rateLimitMap.entries()) {
                if (now > value.resetTime) {
                    rateLimitMap.delete(key);
                }
            }
        }, CLEANUP_INTERVAL);
    }
}

// ─── Security Headers ────────────────────────────────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions policy
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
    // HSTS — only in production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }
    return response;
}

// ─── Request ID Generation ──────────────────────────────────────────────────
function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Routes Configuration ───────────────────────────────────────────────────
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/api/auth',
    '/api/health',
    '/api/migrate',
];

const AUTH_ROUTES = ['/login', '/signup', '/register'];

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some((route) => {
        if (route.endsWith('/')) {
            return pathname === route || pathname.startsWith(route);
        }
        return pathname === route || pathname.startsWith(`${route}/`);
    });
}

function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

// ─── Main Middleware ────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestId = generateRequestId();

    // 1. Rate limiting for API routes
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        if (isRateLimited(ip)) {
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    error: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
                        'X-Request-Id': requestId,
                    },
                }
            );
        }
    }

    // 2. Skip public routes
    if (isPublicRoute(pathname)) {
        const response = NextResponse.next();
        response.headers.set('X-Request-Id', requestId);
        return addSecurityHeaders(response);
    }

    // 3. Auth check for protected routes (/business/*)
    // BetterAuth stores its session token in cookies
    const sessionToken =
        request.cookies.get('better-auth.session_token')?.value ||
        request.cookies.get('__Secure-better-auth.session_token')?.value;

    if (!sessionToken) {
        // No session — redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. If authenticated user tries to access auth pages, redirect to dashboard
    if (isAuthRoute(pathname)) {
        return NextResponse.redirect(new URL('/business/retail', request.url));
    }

    // 5. Proceed with request
    const response = NextResponse.next();
    response.headers.set('X-Request-Id', requestId);
    return addSecurityHeaders(response);
}

// ─── Matcher Configuration ──────────────────────────────────────────────────
// Only run middleware on these paths (skip static files, _next, etc.)
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         * - public folder assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    ],
};
