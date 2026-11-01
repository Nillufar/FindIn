import {Router} from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
    response.json({status: 'ok', service: 'findin-api', timestamp: new Date().toISOString()});
});
