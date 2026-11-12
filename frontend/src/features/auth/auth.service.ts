import type {AuthUser, IdentityProvider} from './auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

/** Starts the backend-mediated OAuth authorization-code flow. */
export function startSignIn(provider: IdentityProvider): void {
    window.location.assign(`${API_BASE_URL}/api/auth/${provider}/start`);
}

export function readAuthCallback(): { user?: AuthUser; error?: string } {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const rawProfile = params.get('auth');
    const error = params.get('auth_error');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

    if (error) return {error};
    if (!rawProfile) return {};

    try {
        return {user: JSON.parse(rawProfile) as AuthUser};
    } catch {
        return {error: 'The identity provider returned an invalid profile.'};
    }
}

export function signOut(): void {
    // No local account or provider token is persisted during the database-free milestone.
}
