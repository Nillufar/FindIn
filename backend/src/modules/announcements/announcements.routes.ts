import {Router} from 'express';
import {z} from 'zod';
import {HttpError} from '../../lib/http-error.js';
import {prisma} from '../../lib/prisma.js';
import {announcementSelect, toAnnouncementView} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser} from '../../middleware/auth.js';

export const announcementsRouter = Router();

const announcementSchema = z.object({
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(2).max(4000),
    projectId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
}).refine((input) => Boolean(input.projectId) !== Boolean(input.organizationId), {
    message: 'Post the announcement to exactly one post or one organization',
});

/**
 * Post owners announce to their team; organization admins announce to members.
 * Members see these on their dashboard.
 */
announcementsRouter.post('/', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const input = announcementSchema.parse(request.body);

    if (input.projectId) {
        const post = await prisma.project.findUnique({where: {id: input.projectId}, select: {ownerId: true}});
        if (!post) throw new HttpError(404, 'Post not found');
        if (post.ownerId !== userId) throw new HttpError(403, 'Only the post owner can announce to this team');
    } else {
        const admin = await prisma.membership.findFirst({
            where: {organizationId: input.organizationId, userId, isAdmin: true},
        });
        if (!admin) throw new HttpError(403, 'Only organization admins can announce to members');
    }

    const row = await prisma.announcement.create({
        data: {
            authorId: userId,
            title: input.title,
            body: input.body,
            projectId: input.projectId ?? null,
            organizationId: input.organizationId ?? null,
        },
        select: announcementSelect,
    });
    response.status(201).json(toAnnouncementView(row));
}));
