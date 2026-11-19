import type {IdentityProvider} from './auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

/** Starts the backend-mediated OAuth authorization-code flow. */
export function startSignIn(provider: IdentityProvider): void {
    window.location.assign(`${API_BASE_URL}/api/auth/${provider}/start`);
}

/** Reads an error the backend put in the URL fragment after a failed sign-in, then clears it. */
export function readAuthError(): string | undefined {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const error = new URLSearchParams(hash).get('auth_error');
    if (hash) window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return error ?? undefined;
}
