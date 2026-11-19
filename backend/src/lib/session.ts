import {createHmac, timingSafeEqual} from 'node:crypto';
import type {Response} from 'express';
import {env} from '../config/env.js';

/**
 * Signed, HttpOnly session cookie: `<userId>.<expiresAtSeconds>.<hmac>`.
 * Nothing secret is stored in it; the HMAC stops anyone from forging another user id.
 */
export const SESSION_COOKIE = 'findin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function sign(payload: string): string {
    return createHmac('sha256', env.SESSION_SECRET).update(payload).digest('base64url');
}

export function createSessionValue(userId: string, now = Date.now()): string {
    const payload = `${userId}.${Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS}`;
    return `${payload}.${sign(payload)}`;
}

/** Returns the user id for a valid, unexpired session value, otherwise undefined. */
export function readSessionValue(value: string | undefined, now = Date.now()): string | undefined {
    if (!value) return undefined;
    const parts = value.split('.');
    if (parts.length !== 3) return undefined;
    const [userId, expiresAt, signature] = parts as [string, string, string];
    const expected = Buffer.from(sign(`${userId}.${expiresAt}`));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return undefined;
    if (Number(expiresAt) * 1000 < now) return undefined;
    return userId;
}

function cookieAttributes(maxAge: number): string {
    const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
    return `HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function setSessionCookie(response: Response, userId: string): void {
    response.append('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(createSessionValue(userId))}; ${cookieAttributes(SESSION_MAX_AGE_SECONDS)}`);
}

export function clearSessionCookie(response: Response): void {
    response.append('Set-Cookie', `${SESSION_COOKIE}=; ${cookieAttributes(0)}`);
}
