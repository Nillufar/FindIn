import type {ErrorRequestHandler} from 'express';
import {ZodError} from 'zod';
import {HttpError} from '../lib/http-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof HttpError) {
        response.status(error.statusCode).json({
            error: error.message,
            details: error.details,
        });
        return;
    }

    if (error instanceof ZodError) {
        response.status(400).json({error: 'Please check the highlighted fields', details: error.flatten()});
        return;
    }

    console.error(error);
    response.status(500).json({error: 'Internal server error'});
};
