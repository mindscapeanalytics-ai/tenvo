/**
 * Standard Server Action Response Utilities
 * 2026 Enterprise Architecture: Result-First Pattern
 * 
 * NOTE: These are marked async to satisfy Next.js build-time constraints 
 * requiring all exports in action-related modules to be asynchronous.
 */

export async function actionSuccess(payload = {}) {
    return { success: true, ...payload };
}

export async function actionFailure(code, error, details = null) {
    return {
        success: false,
        code,
        error,
        ...(details ? { details } : {})
    };
}

export async function getErrorMessage(error, fallback = 'Unexpected server error') {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message || fallback;
    return fallback;
}
