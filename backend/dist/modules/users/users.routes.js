import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { profileUpdateSchema } from './profile.schema.js';
export const usersRouter = Router();
const profileSelect = {
    id: true,
    username: true,
    displayName: true,
    bio: true,
    fieldOfStudy: true,
    skills: true,
    portfolioUrl: true,
    githubRepositories: true,
    updatedAt: true,
};
usersRouter.get('/me/profile', async (request, response, next) => {
    const userId = request.user?.id;
    if (!userId) {
        response.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        const profile = await prisma.user.findUnique({
            where: { id: userId },
            select: profileSelect,
        });
        if (!profile) {
            response.status(404).json({ error: 'User not found' });
            return;
        }
        response.json(profile);
    }
    catch (error) {
        next(error);
    }
});
usersRouter.patch('/me/profile', async (request, response, next) => {
    const userId = request.user?.id;
    if (!userId) {
        response.status(401).json({ error: 'Authentication required' });
        return;
    }
    const result = profileUpdateSchema.safeParse(request.body);
    if (!result.success) {
        response.status(400).json({
            error: 'Invalid profile update',
            details: result.error.issues.map(({ path, message }) => ({ path, message })),
        });
        return;
    }
    try {
        const profile = await prisma.user.update({
            where: { id: userId },
            data: result.data,
            select: profileSelect,
        });
        response.json(profile);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            response.status(404).json({ error: 'User not found' });
            return;
        }
        next(error);
    }
});
