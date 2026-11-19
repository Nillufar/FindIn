import express from 'express';
import cors from 'cors';
import {env} from './config/env.js';
import {loadSession} from './middleware/auth.js';
import {errorHandler} from './middleware/error-handler.js';
import {authRouter} from './modules/auth/auth.routes.js';
import {dashboardRouter} from './modules/dashboard/dashboard.routes.js';
import {healthRouter} from './modules/health/health.routes.js';
import {invitationsRouter} from './modules/invitations/invitations.routes.js';
import {matchingRouter} from './modules/matching/matching.routes.js';
import {organizationsRouter} from './modules/organizations/organizations.routes.js';
import {postsRouter} from './modules/posts/posts.routes.js';
import {usersRouter} from './modules/users/users.routes.js';

const app = express();

app.use(cors({origin: env.FRONTEND_URL, credentials: true}));
app.use(express.json());
app.use(loadSession);

app.get('/', (_request, response) => response.json({name: 'FindIn API', version: '0.1.0'}));
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
// Projects, jobs and collaborations are all "posts" stored in the Project table.
app.use('/api/projects', matchingRouter);
app.use('/api/projects', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use(errorHandler);

app.listen(env.PORT, () => {
    console.log(`FindIn API listening on http://localhost:${env.PORT}`);
});
