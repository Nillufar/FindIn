import express from 'express';
import cors from 'cors';
import {env} from './config/env.js';
import {errorHandler} from './middleware/error-handler.js';
import {healthRouter} from './modules/health/health.routes.js';

const app = express();

app.use(cors({origin: env.FRONTEND_URL}));
app.use(express.json());

app.get('/', (_request, response) => response.json({name: 'FindIn API', version: '0.1.0'}));
app.use('/api/health', healthRouter);
app.use(errorHandler);

app.listen(env.PORT, () => {
    console.log(`FindIn API listening on http://localhost:${env.PORT}`);
});
