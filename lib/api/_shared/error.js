export function createApiError(result, fallbackMessage = 'Request failed') {
    const error = new Error(result?.error || fallbackMessage);

    error.code = result?.errorCode || result?.code || null;
    error.requiredPlan = result?.requiredPlan || result?.details?.requiredPlan || null;
    error.limitKey = result?.limitKey || result?.details?.limitKey || null;

    const limitCandidate = result?.limit ?? result?.details?.limit;
    error.limit = Number.isFinite(Number(limitCandidate)) ? Number(limitCandidate) : null;

    error.details = result?.details || null;

    return error;
}
