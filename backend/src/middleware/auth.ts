import type {NextFunction, Request, RequestHandler, Response} from 'express';
import {getCookie} from '../lib/cookies.js';
import {HttpError} from '../lib/http-error.js';
import {SESSION_COOKIE, readSessionValue} from '../lib/session.js';

declare module 'express-serve-static-core' {
    interface Request {
        userId?: string;
    }
}

/** Attaches `request.userId` when a valid session cookie is present. Never rejects. */
export const loadSession: RequestHandler = (request, _response, next) => {
    request.userId = readSessionValue(getCookie(request, SESSION_COOKIE));
    next();
};

export function requireUser(request: Request, _response: Response, next: NextFunction): void {
    if (!request.userId) {
        next(new HttpError(401, 'Please sign in first'));
        return;
    }
    next();
}

/** Returns the signed-in user id; use after `requireUser`. */
export function currentUserId(request: Request): string {
    if (!request.userId) throw new HttpError(401, 'Please sign in first');
    return request.userId;
}

/** Express 4 does not forward rejected promises to the error handler; this does. */
export function asyncHandler(handler: (request: Request, response: Response) => Promise<unknown>): RequestHandler {
    return (request, response, next) => {
        handler(request, response).catch(next);
    };
}

/** Reads a route parameter such as `:postId` as a single string. */
export function routeParam(request: Request, name: string): string {
    const value = request.params[name];
    const single = Array.isArray(value) ? value[0] : value;
    if (!single) throw new Error(`Missing route parameter: ${name}`);
    return single;
}
