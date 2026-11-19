import {Router} from 'express';
import type {DashboardResponse} from '@findin/shared';
import {prisma} from '../../lib/prisma.js';
import {
    invitationSelect,
    projectCardSelect,
    toInvitationView,
    toProjectCard,
} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser} from '../../middleware/auth.js';

export const dashboardRouter = Router();

/** Everything for the dashboard in one request: applied, requests, invitations, cards. */
dashboardRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const newestFirst = {updatedAt: 'desc' as const};

    const [applied, requests, invitations, invitesSent, myPosts] = await Promise.all([
        prisma.invitation.findMany({where: {applicantId: userId, type: 'REQUEST'}, select: invitationSelect, orderBy: newestFirst}),
        prisma.invitation.findMany({
            where: {type: 'REQUEST', project: {ownerId: userId}},
            select: invitationSelect,
            orderBy: [{status: 'asc'}, newestFirst],
        }),
        prisma.invitation.findMany({where: {applicantId: userId, type: 'INVITE'}, select: invitationSelect, orderBy: newestFirst}),
        prisma.invitation.findMany({where: {inviterId: userId, type: 'INVITE'}, select: invitationSelect, orderBy: newestFirst}),
        prisma.project.findMany({where: {ownerId: userId, status: 'ACTIVE'}, select: projectCardSelect, orderBy: {createdAt: 'desc'}}),
    ]);

    const body: DashboardResponse = {
        applied: applied.map(toInvitationView),
        requests: requests.map(toInvitationView),
        invitations: invitations.map(toInvitationView),
        invitesSent: invitesSent.map(toInvitationView),
        myPosts: myPosts.map(toProjectCard),
    };
    response.json(body);
}));
