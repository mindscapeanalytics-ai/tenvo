import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

function isGetSessionRequest(req) {
    return req?.nextUrl?.pathname?.endsWith('/get-session');
}

function buildNullSessionResponse() {
    const response = NextResponse.json(null, { status: 200 });
    // Reset auth cookies so corrupt/stale tokens do not keep causing session parsing failures.
    response.cookies.set('better-auth.session_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('__Secure-better-auth.session_token', '', { maxAge: 0, path: '/' });
    return response;
}

export const POST = async (req) => {
    try {
        return await handler.POST(req);
    } catch (e) {
        console.error("BETTER_AUTH_POST_ERROR:", e);
        throw e;
    }
};

export const GET = async (req) => {
    try {
        return await handler.GET(req);
    } catch (e) {
        console.error("BETTER_AUTH_GET_ERROR:", e);
        if (isGetSessionRequest(req)) {
            return buildNullSessionResponse();
        }
        return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
    }
};
