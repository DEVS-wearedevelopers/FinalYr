/**
 * parseApiError
 * -------------
 * Returns a single, human-readable error string suitable for display.
 * All raw details (Zod issues, stack traces, DB errors) stay server-side
 * and are visible in the EOC Admin System Log panel.
 */
export function parseApiError(err: any): string {
    const res = err?.response?.data;

    if (!res) {
        if (!err?.response) return 'Unable to reach the server. Check your connection.';
        return 'Request failed. Please try again.';
    }

    // Hono validation error — surface just the top-level message, not field details
    if (res.error?.issues) return 'Validation failed. Please review your input and try again.';

    // { error: "string" }
    if (typeof res.error === 'string') {
        // Strip internal prefixes like "Validation failed: " for display
        return res.error.replace(/^Validation failed:\s*/i, '').trim() || 'Something went wrong.';
    }

    // { message: "string" }
    if (typeof res.message === 'string') return res.message;

    return `Request failed (${err?.response?.status ?? 'unknown'}). Please try again.`;
}
