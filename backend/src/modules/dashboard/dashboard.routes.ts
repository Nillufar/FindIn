import {Router} from 'express';
import type {DashboardResponse} from '@findin/shared';
import {prisma} from '../../lib/prisma.js';
import {
    announcementSelect,
    invitationSelect,
    projectCardSelect,
    toAnnouncementView,
    toInvitationView,
    toProjectCard,
} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser} from '../../middleware/auth.js';

export const dashboardRouter = Router();

/** Everything for the dashboard in one request: applied, requests, invitations, posts, announcements. */
dashboardRouter.get('/', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const newestFirst = {updatedAt: 'desc' as const};

    const [applied, requests, invitations, invitesSent, myPosts, joinedPosts, memberships] = await Promise.all([
        prisma.invitation.findMany({where: {applicantId: userId, type: 'REQUEST'}, select: invitationSelect, orderBy: newestFirst}),
        prisma.invitation.findMany({
            where: {type: 'REQUEST', project: {ownerId: userId}},
            select: invitationSelect,
            orderBy: [{status: 'asc'}, newestFirst],
        }),
        prisma.invitation.findMany({where: {applicantId: userId, type: 'INVITE'}, select: invitationSelect, orderBy: newestFirst}),
        prisma.invitation.findMany({where: {inviterId: userId, type: 'INVITE'}, select: invitationSelect, orderBy: newestFirst}),
        prisma.project.findMany({where: {ownerId: userId, status: 'ACTIVE'}, select: projectCardSelect, orderBy: {createdAt: 'desc'}}),
        prisma.invitation.findMany({where: {applicantId: userId, status: 'ACCEPTED'}, select: {projectId: true}}),
        prisma.membership.findMany({where: {userId, isCurrent: true}, select: {organizationId: true}}),
    ]);

    // Announcements from posts I own or joined, and organizations I belong to.
    const projectIds = [...myPosts.map((post) => post.id), ...joinedPosts.map((entry) => entry.projectId)];
    const organizationIds = memberships.map((entry) => entry.organizationId);
    const announcements = await prisma.announcement.findMany({
        where: {OR: [{projectId: {in: projectIds}}, {organizationId: {in: organizationIds}}]},
        select: announcementSelect,
        orderBy: {createdAt: 'desc'},
        take: 30,
    });

    const body: DashboardResponse = {
        applied: applied.map(toInvitationView),
        requests: requests.map(toInvitationView),
        invitations: invitations.map(toInvitationView),
        invitesSent: invitesSent.map(toInvitationView),
        myPosts: myPosts.map(toProjectCard),
        announcements: announcements.map(toAnnouncementView),
    };
    response.json(body);
}));
