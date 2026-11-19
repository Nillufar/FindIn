export class ApiError extends Error {
    constructor(readonly status: number, message: string, readonly details?: unknown) {
        super(message);
        this.name = 'ApiError';
    }
}

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    signal?: AbortSignal;
};

/** Calls the FindIn API with the session cookie. Throws ApiError with the server's message. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`/api${path}`, {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers: options.body === undefined ? undefined : {'Content-Type': 'application/json'},
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
    });

    if (response.status === 204) return undefined as T;
    const body = await response.json().catch(() => null) as ({ error?: string; details?: unknown } & T) | null;
    if (!response.ok) {
        throw new ApiError(response.status, body?.error ?? `Request failed (${response.status})`, body?.details);
    }
    return body as T;
}

/** Turns a zod "fieldErrors" payload into one readable line for forms. */
export function describeError(error: unknown): string {
    if (error instanceof ApiError) {
        const fieldErrors = (error.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
        const first = fieldErrors && Object.entries(fieldErrors).find(([, messages]) => messages.length > 0);
        return first ? `${first[0]}: ${first[1][0]}` : error.message;
    }
    return error instanceof Error ? error.message : 'Something went wrong';
}
