import {randomBytes, timingSafeEqual} from 'node:crypto';
import {Router} from 'express';
import {env} from '../../config/env.js';
import {getCookie} from '../../lib/cookies.js';
import {prisma} from '../../lib/prisma.js';
import {clearSessionCookie, setSessionCookie} from '../../lib/session.js';
import {asyncHandler, routeParam} from '../../middleware/auth.js';

type Provider = 'google' | 'github';

type ProviderProfile = {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    /** GitHub username, used to prefill the profile's GitHub link. */
    login?: string;
    provider: Provider;
};

export const authRouter = Router();

const STATE_COOKIE = 'findin_oauth_state';
const STATE_MAX_AGE_SECONDS = 600;

function callbackUrl(provider: Provider) {
    return `${env.BACKEND_URL}/api/auth/${provider}/callback`;
}

function credentialsFor(provider: Provider) {
    return provider === 'google'
        ? {clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET}
        : {clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET};
}

function setStateCookie(response: { append: (name: string, value: string) => void }, value: string) {
    response.append('Set-Cookie', `${STATE_COOKIE}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=${STATE_MAX_AGE_SECONDS}`);
}

function clearStateCookie(response: { append: (name: string, value: string) => void }) {
    response.append('Set-Cookie', `${STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0`);
}

function statesMatch(received: string | undefined, expected: string | undefined) {
    if (!received || !expected) return false;
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);
    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function redirectWithError(response: { redirect: (url: string) => void }, message: string) {
    response.redirect(`${env.FRONTEND_URL}/#auth_error=${encodeURIComponent(message)}`);
}

/** Find or create the FindIn account for this provider profile (matched by verified email). */
async function upsertUser(profile: ProviderProfile) {
    return prisma.user.upsert({
        where: {email: profile.email.toLowerCase()},
        update: {avatarUrl: profile.avatarUrl ?? undefined},
        create: {
            email: profile.email.toLowerCase(),
            displayName: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
            githubUrl: profile.provider === 'github' && profile.login ? `https://github.com/${profile.login}` : null,
        },
    });
}

function requireProviderConfig(response: { redirect: (url: string) => void }, provider: Provider) {
    const credentials = credentialsFor(provider);
    if (!credentials.clientId || !credentials.clientSecret) {
        redirectWithError(response, `${provider} authentication is not configured yet`);
        return false;
    }
    return true;
}

/** Who is signed in. 401 when there is no valid session. */
authRouter.get('/me', asyncHandler(async (request, response) => {
    const user = request.userId
        ? await prisma.user.findUnique({
            where: {id: request.userId},
            select: {id: true, displayName: true, email: true, avatarUrl: true, university: true, major: true},
        })
        : null;
    if (!user) {
        response.status(401).json({error: 'Not signed in'});
        return;
    }
    response.json({...user, isProfileComplete: Boolean(user.university && user.major)});
}));

authRouter.post('/logout', (_request, response) => {
    clearSessionCookie(response);
    response.status(204).end();
});

/**
 * Local development only: sign in as a seeded demo account without OAuth keys.
 * Disabled whenever NODE_ENV is not "development".
 */
authRouter.post('/dev-login', asyncHandler(async (request, response) => {
    if (env.NODE_ENV !== 'development') {
        response.status(404).json({error: 'Not found'});
        return;
    }
    const email = typeof request.body?.email === 'string' ? request.body.email.toLowerCase() : 'demo@findin.test';
    const user = await prisma.user.upsert({
        where: {email},
        update: {},
        create: {email, displayName: 'Demo Student'},
    });
    setSessionCookie(response, user.id);
    response.status(204).end();
}));

authRouter.get('/:provider/start', (request, response) => {
    const provider = routeParam(request, 'provider') as Provider;
    if (provider !== 'google' && provider !== 'github') return response.status(404).json({error: 'Unsupported provider'});
    if (!requireProviderConfig(response, provider)) return;

    const state = randomBytes(32).toString('hex');
    setStateCookie(response, state);

    const credentials = credentialsFor(provider);
    const authorizationUrl = provider === 'google'
        ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
        : new URL('https://github.com/login/oauth/authorize');
    authorizationUrl.search = new URLSearchParams({
        client_id: credentials.clientId!,
        redirect_uri: callbackUrl(provider),
        response_type: 'code',
        scope: provider === 'google' ? 'openid email profile' : 'read:user user:email',
        state,
    }).toString();

    response.redirect(authorizationUrl.toString());
});

authRouter.get('/:provider/callback', async (request, response) => {
    const provider = routeParam(request, 'provider') as Provider;
    if (provider !== 'google' && provider !== 'github') return response.status(404).send('Unsupported provider');

    const code = typeof request.query.code === 'string' ? request.query.code : undefined;
    const state = typeof request.query.state === 'string' ? request.query.state : undefined;
    const expectedState = getCookie(request, STATE_COOKIE);
    clearStateCookie(response);

    if (!statesMatch(state, expectedState)) return redirectWithError(response, 'Authentication state could not be verified');
    if (!code) return redirectWithError(response, 'The provider did not return an authorization code');

    try {
        const credentials = credentialsFor(provider);
        const tokenResponse = await fetch(provider === 'google' ? 'https://oauth2.googleapis.com/token' : 'https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                client_id: credentials.clientId!,
                client_secret: credentials.clientSecret!,
                code,
                redirect_uri: callbackUrl(provider),
                grant_type: 'authorization_code',
            }),
        });
        const token = await tokenResponse.json() as {
            access_token?: string;
            error?: string;
            error_description?: string;
        };
        if (!tokenResponse.ok || !token.access_token) {
            console.error('OAuth token exchange rejected', {
                provider,
                status: tokenResponse.status,
                error: token.error,
                description: token.error_description,
            });
            throw new Error('Provider token exchange failed');
        }

        const profile = provider === 'google'
            ? await getGoogleProfile(token.access_token)
            : await getGithubProfile(token.access_token);
        const user = await upsertUser({...profile, provider});
        setSessionCookie(response, user.id);
        response.redirect(`${env.FRONTEND_URL}/`);
    } catch (error) {
        console.error('OAuth callback failed', error);
        redirectWithError(response, 'Authentication could not be completed');
    }
});

async function getGoogleProfile(accessToken: string) {
    const result = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {headers: {Authorization: `Bearer ${accessToken}`}});
    const profile = await result.json() as { sub?: string; name?: string; email?: string; picture?: string };
    if (!result.ok || !profile.sub || !profile.email) throw new Error('Google profile was incomplete');
    return {id: profile.sub, name: profile.name ?? profile.email, email: profile.email, avatarUrl: profile.picture};
}

async function getGithubProfile(accessToken: string) {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
    const profileResponse = await fetch('https://api.github.com/user', {headers});
    const profile = await profileResponse.json() as {
        id?: number;
        name?: string;
        login?: string;
        email?: string;
        avatar_url?: string
    };
    if (!profileResponse.ok || !profile.id) throw new Error('GitHub profile was incomplete');

    let email = profile.email;
    if (!email) {
        const emailResponse = await fetch('https://api.github.com/user/emails', {headers});
        const emails = await emailResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
        email = emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email;
    }
    if (!email) throw new Error('GitHub did not provide a verified email address');
    return {
        id: String(profile.id),
        name: profile.name ?? profile.login ?? email,
        email,
        avatarUrl: profile.avatar_url,
        login: profile.login,
    };
}
