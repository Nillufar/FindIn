import type {AuthResult, IdentityProvider} from './auth.types';

const MOCK_USER: Record<IdentityProvider, AuthResult> = {
    google: {
        user: {id: 'mock-google-user', name: 'Google Demo User', email: 'demo.google@findin.local', provider: 'google'},
        accessToken: 'mock-google-access-token',
    },
    github: {
        user: {id: 'mock-github-user', name: 'GitHub Demo User', email: 'demo.github@findin.local', provider: 'github'},
        accessToken: 'mock-github-access-token',
    },
};

/** Temporary adapter. Replace this body with the real identity-provider redirect flow later. */
export async function signInWithProvider(provider: IdentityProvider): Promise<AuthResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    const result = MOCK_USER[provider];
    window.localStorage.setItem('findin.auth', JSON.stringify(result));
    return result;
}

export function signOut(): void {
    window.localStorage.removeItem('findin.auth');
}
