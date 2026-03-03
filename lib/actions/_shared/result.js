export function actionSuccess(payload = {}) {
    return { success: true, ...payload };
}

export function actionFailure(code, error, details = null) {
    return {
        success: false,
        code,
        error,
        ...(details ? { details } : {})
    };
}

export function getErrorMessage(error, fallback = 'Unexpected server error') {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message || fallback;
    return fallback;
}
