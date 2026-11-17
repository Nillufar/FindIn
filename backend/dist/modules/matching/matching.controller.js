import { HttpError } from '../../lib/http-error.js';
import { parseProjectSearchQuery } from './project-search.query.js';
import { searchProjects } from './project-search.service.js';
import { ZodError } from 'zod';
export const searchProjectsHandler = async (request, response, next) => {
    try {
        const filters = parseProjectSearchQuery(request.query);
        const result = await searchProjects(filters);
        response.json(result);
    }
    catch (error) {
        if (error instanceof ZodError) {
            next(new HttpError(400, 'Invalid search query', error.flatten()));
            return;
        }
        next(error);
    }
};
