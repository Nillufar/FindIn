import {Router} from 'express';
import {z} from 'zod';
import {POST_KINDS, SOURCE_TYPES, TIMELINE_CLASSES, type PostDetail} from '@findin/shared';
import {HttpError} from '../../lib/http-error.js';
import {prisma} from '../../lib/prisma.js';
import {
    announcementSelect,
    emptyToUndefined,
    invitationSelect,
    normalizeTags,
    projectCardSelect,
    toAnnouncementView,
    toInvitationView,
    toProjectCard,
    toUserSummary,
    userSummarySelect,
} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser, routeParam} from '../../middleware/auth.js';

export const postsRouter = Router();

const postInputSchema = z.object({
    kind: z.enum(POST_KINDS),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(4000),
    fieldOfStudy: z.string().trim().min(1).max(120),
    minWeeklyHours: z.coerce.number().int().min(1).max(80),
    timeline: z.enum(TIMELINE_CLASSES),
    requiredSkills: z.array(z.string().max(48)).max(15).default([]),
    sourceType: z.union([z.literal(''), z.enum(SOURCE_TYPES)]).optional(),
    repositoryUrl: z.union([z.literal(''), z.string().trim().url().max(300)]).optional(),
    location: z.string().trim().max(120).optional(),
    compensation: z.string().trim().max(120).optional(),
    organizationId: z.string().uuid().optional().or(z.literal('')),
});

const messageSchema = z.object({message: z.string().trim().max(1000).optional()});
const inviteSchema = messageSchema.extend({userId: z.string().uuid()});

async function requireOrganizationAdmin(userId: string, organizationId: string) {
    const membership = await prisma.membership.findFirst({where: {userId, organizationId, isAdmin: true}});
    if (!membership) throw new HttpError(403, 'Only admins of that organization can post for it');
}

/** Create a pending request/invitation, or re-open one that was declined or cancelled. */
async function openInvitation(data: {
    projectId: string;
    applicantId: string;
    inviterId: string;
    type: 'INVITE' | 'REQUEST';
    message?: string;
}) {
    const existing = await prisma.invitation.findUnique({
        where: {projectId_applicantId: {projectId: data.projectId, applicantId: data.applicantId}},
    });
    if (existing?.status === 'ACCEPTED') throw new HttpError(409, 'Already part of this team');
    if (existing?.status === 'PENDING') {
        throw new HttpError(409, existing.type === 'INVITE'
            ? 'There is already an invitation waiting for a reply'
            : 'There is already a request waiting for a reply');
    }
    const row = existing
        ? await prisma.invitation.update({
            where: {id: existing.id},
            data: {...data, status: 'PENDING', message: data.message ?? null},
            select: invitationSelect,
        })
        : await prisma.invitation.create({data: {...data, message: data.message ?? null}, select: invitationSelect});
    return toInvitationView(row);
}

postsRouter.post('/', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const input = emptyToUndefined(postInputSchema.parse(request.body));
    if (input.organizationId) await requireOrganizationAdmin(userId, input.organizationId);

    const row = await prisma.project.create({
        data: {
            kind: input.kind,
            title: input.title,
            description: input.description,
            fieldOfStudy: input.fieldOfStudy,
            minWeeklyHours: input.minWeeklyHours,
            timeline: input.timeline,
            sourceType: input.sourceType || null,
            repositoryUrl: input.repositoryUrl ?? null,
            location: input.location ?? null,
            compensation: input.compensation ?? null,
            organizationId: input.organizationId || null,
            ownerId: userId,
            requiredSkills: {create: normalizeTags(input.requiredSkills).map((skill) => ({skill}))},
        },
        select: projectCardSelect,
    });
    response.status(201).json(toProjectCard(row));
}));

postsRouter.get('/:postId', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const post = await prisma.project.findUnique({
        where: {id: routeParam(request, 'postId')},
        select: {
            ...projectCardSelect,
            invitations: {select: invitationSelect, orderBy: {createdAt: 'desc'}},
            announcements: {select: announcementSelect, orderBy: {createdAt: 'desc'}, take: 20},
        },
    });
    if (!post) throw new HttpError(404, 'Post not found');

    const viewerIsOwner = post.ownerId === userId;
    const invitations = post.invitations.map(toInvitationView);
    const accepted = post.invitations.filter((entry) => entry.status === 'ACCEPTED');
    const viewerInvitation = invitations.find((entry) => entry.applicant.id === userId);
    const viewerIsMember = viewerIsOwner || viewerInvitation?.status === 'ACCEPTED';

    const body: PostDetail = {
        ...toProjectCard(post),
        team: [post.owner, ...accepted.map((entry) => entry.applicant)].map(toUserSummary),
        // Announcements are for the team; everyone else sees only the public post.
        announcements: viewerIsMember ? post.announcements.map(toAnnouncementView) : [],
        viewerIsOwner,
        viewerInvitation,
        invitations: viewerIsOwner ? invitations : [],
    };
    response.json(body);
}));

/** "Request to join" for projects and collaborations, "Apply" for jobs. */
postsRouter.post('/:postId/requests', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const {message} = messageSchema.parse(request.body ?? {});
    const post = await prisma.project.findUnique({where: {id: routeParam(request, 'postId')}});
    if (!post || post.status !== 'ACTIVE') throw new HttpError(404, 'This post is no longer open');
    if (post.ownerId === userId) throw new HttpError(400, 'You own this post');
    const invitation = await openInvitation({
        projectId: post.id,
        applicantId: userId,
        inviterId: userId,
        type: 'REQUEST',
        message,
    });
    response.status(201).json(invitation);
}));

/** The owner invites a specific person to join. */
postsRouter.post('/:postId/invitations', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const input = inviteSchema.parse(request.body);
    const post = await prisma.project.findUnique({where: {id: routeParam(request, 'postId')}});
    if (!post || post.status !== 'ACTIVE') throw new HttpError(404, 'This post is no longer open');
    if (post.ownerId !== userId) throw new HttpError(403, 'Only the owner can invite people to this post');
    if (input.userId === userId) throw new HttpError(400, 'You cannot invite yourself');
    const invitee = await prisma.user.findUnique({where: {id: input.userId}, select: userSummarySelect});
    if (!invitee) throw new HttpError(404, 'That person was not found');
    const invitation = await openInvitation({
        projectId: post.id,
        applicantId: input.userId,
        inviterId: userId,
        type: 'INVITE',
        message: input.message,
    });
    response.status(201).json(invitation);
}));

/** Owner closes a post so it no longer shows in Explore. */
postsRouter.post('/:postId/close', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const result = await prisma.project.updateMany({
        where: {id: routeParam(request, 'postId'), ownerId: userId},
        data: {status: 'COMPLETED'},
    });
    if (result.count === 0) throw new HttpError(404, 'Post not found');
    response.status(204).end();
}));
