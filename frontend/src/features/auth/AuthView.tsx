import {useEffect, useState} from 'react';
import {describeError} from '../../api/client';
import {authApi} from '../../api/findin';
import {readAuthError, startSignIn} from './auth.service';
import type {IdentityProvider} from './auth.types';
import {useSession} from './session';

type AuthMode = 'login' | 'signup';

function GoogleIcon() {
    return <img className="provider-icon" src="/icons/google.svg" alt="" aria-hidden="true"/>;
}

function GithubIcon() {
    return <img className="provider-icon provider-icon-github" src="/icons/github.svg" alt="" aria-hidden="true"/>;
}

export function AuthView() {
    const {refresh} = useSession();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loadingProvider, setLoadingProvider] = useState<IdentityProvider | 'demo' | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const callbackError = readAuthError();
        if (callbackError) setError(callbackError);
    }, []);

    /** Local development only: sign in as the seeded demo student without OAuth keys. */
    async function handleDemoSignIn() {
        setError('');
        setLoadingProvider('demo');
        try {
            await authApi.devLogin('maya@findin.test');
            await refresh();
        } catch (caught) {
            setError(describeError(caught));
            setLoadingProvider(null);
        }
    }

    function handleProviderSignIn(provider: IdentityProvider) {
        setError('');
        setLoadingProvider(provider);
        startSignIn(provider);
    }

    return (
        <main className="auth-page">
            <section className="auth-brand-panel" aria-label="FindIn introduction">
                <div className="brand-content">
                    <img className="brand-logo" src="/findin-logo.webp" alt="FindIn"/>
                    <p className="brand-kicker">For builders and engineers</p>
                    <h1>Find your team, your job, your partners.</h1>
                    <p className="brand-copy">Join open-source and private software projects, land paid tech roles,
                        and team up on firmware, hardware and hackathons.</p>
                    <div className="brand-rule"/>
                    <p className="brand-note">C, C++, Python, JavaScript, React, firmware, hardware and open source.</p>
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
                        {import.meta.env.DEV && (
                            <button className="provider-button provider-button--demo" type="button" disabled={loadingProvider !== null}
                                    onClick={handleDemoSignIn}>
                                <span className="provider-icon provider-icon--demo" aria-hidden="true">★</span>
                                <span>{loadingProvider === 'demo' ? 'Signing in...' : 'Continue as demo student (local only)'}</span>
                                <span className="button-arrow">→</span>
                            </button>
                        )}
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
