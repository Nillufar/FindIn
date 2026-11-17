import {useEffect, useState} from 'react';
import {readAuthCallback, signOut, startSignIn} from './auth.service';
import type {AuthUser, IdentityProvider} from './auth.types';

type AuthMode = 'login' | 'signup';

function GoogleIcon() {
    return <img className="provider-icon" src="/icons/google.svg" alt="" aria-hidden="true"/>;
}

function GithubIcon() {
    return <img className="provider-icon provider-icon-github" src="/icons/github.svg" alt="" aria-hidden="true"/>;
}

export function AuthView({initialUser = null}: { initialUser?: AuthUser | null }) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [user, setUser] = useState<AuthUser | null>(initialUser);
    const [loadingProvider, setLoadingProvider] = useState<IdentityProvider | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const callback = readAuthCallback();
        if (callback.user) setUser(callback.user);
        if (callback.error) setError(callback.error);
    }, []);

    function handleProviderSignIn(provider: IdentityProvider) {
        setError('');
        setLoadingProvider(provider);
        startSignIn(provider);
    }

    function handleSignOut() {
        signOut();
        setUser(null);
    }

    if (user) {
        return (
            <main className="auth-page auth-page-signed-in">
                <section className="signed-in-card" aria-live="polite">
                    <img className="signed-in-logo" src="/findin-logo.webp" alt="FindIn"/>
                    <p className="eyebrow">You are signed in</p>
                    <h1>Welcome, {user.name}.</h1>
                    <p className="auth-muted">Your {user.provider === 'google' ? 'Google' : 'GitHub'} identity is
                        connected to FindIn.</p>
                    <button className="text-button" type="button" onClick={handleSignOut}>Sign out</button>
                </section>
            </main>
        );
    }

    return (
        <main className="auth-page">
            <section className="auth-brand-panel" aria-label="FindIn introduction">
                <div className="brand-content">
                    <img className="brand-logo" src="/findin-logo.webp" alt="FindIn"/>
                    <p className="brand-kicker">Find your next team</p>
                    <h1>Turn good ideas into shared progress.</h1>
                    <p className="brand-copy">Find projects that match your skills, meet collaborators, and build
                        something meaningful together.</p>
                    <div className="brand-rule"/>
                    <p className="brand-note">A focused space for developers and project creators.</p>
                </div>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-wrap">
                    <div className="mode-switch" role="tablist" aria-label="Authentication mode">
                        <button className={mode === 'login' ? 'mode-tab mode-tab-active' : 'mode-tab'} type="button"
                                onClick={() => setMode('login')} role="tab" aria-selected={mode === 'login'}>Log in
                        </button>
                        <button className={mode === 'signup' ? 'mode-tab mode-tab-active' : 'mode-tab'} type="button"
                                onClick={() => setMode('signup')} role="tab" aria-selected={mode === 'signup'}>Sign up
                        </button>
                    </div>
                    <p className="eyebrow">Welcome to FindIn</p>
                    <h2>{mode === 'login' ? 'Pick up where you left off.' : 'Start building with the right people.'}</h2>
                    <p className="auth-muted">{mode === 'login' ? 'Use your existing identity provider to continue.' : 'Create your account securely with an identity provider.'}</p>
                    <div className="provider-list">
                        <button className="provider-button" type="button" disabled={loadingProvider !== null}
                                onClick={() => handleProviderSignIn('google')}>
                            <GoogleIcon/><span>{loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}</span><span
                            className="button-arrow">→</span>
                        </button>
                        <button className="provider-button" type="button" disabled={loadingProvider !== null}
                                onClick={() => handleProviderSignIn('github')}>
                            <GithubIcon/><span>{loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}</span><span
                            className="button-arrow">→</span>
                        </button>
                    </div>
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <div className="auth-divider"><span>secure access</span></div>
                    <p className="privacy-note">FindIn does not store your password. Authentication is handled by your
                        selected identity provider.</p>
                    <p className="auth-footer">By continuing, you agree to use FindIn respectfully and responsibly.</p>
                </div>
            </section>
        </main>
    );
}
