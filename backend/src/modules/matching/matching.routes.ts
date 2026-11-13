import {Router} from 'express';
import {searchProjectsHandler} from './matching.controller.js';

export const matchingRouter = Router();

/** GET /api/projects/search — multi-tag project discovery (FR-03, NFR-03). */
matchingRouter.get('/search', searchProjectsHandler);
