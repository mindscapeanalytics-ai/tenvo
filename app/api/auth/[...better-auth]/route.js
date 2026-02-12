import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

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
        throw e;
    }
};
