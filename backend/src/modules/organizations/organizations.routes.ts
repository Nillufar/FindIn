import {Router} from 'express';
import {z} from 'zod';
import {ORGANIZATION_TYPES, type OrganizationDetail} from '@findin/shared';
import {HttpError} from '../../lib/http-error.js';
import {prisma} from '../../lib/prisma.js';
import {
    emptyToUndefined,
    organizationSummarySelect,
    projectCardSelect,
    toOrganizationSummary,
    toProjectCard,
    toUserSummary,
    userSummarySelect,
} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser, routeParam} from '../../middleware/auth.js';

export const organizationsRouter = Router();

const organizationInputSchema = z.object({
    name: z.string().trim().min(2).max(120),
    type: z.enum(ORGANIZATION_TYPES),
    description: z.string().trim().max(2000).optional(),
    websiteUrl: z.union([z.literal(''), z.string().trim().url().max(300)]).optional(),
    location: z.string().trim().max(120).optional(),
});

/** Organizations the signed-in person can post for (they are an admin). */
organizationsRouter.get('/mine', requireUser, asyncHandler(async (request, response) => {
    const memberships = await prisma.membership.findMany({
        where: {userId: currentUserId(request), isAdmin: true},
        select: {organization: {select: organizationSummarySelect}},
        orderBy: {organization: {name: 'asc'}},
    });
    response.json(memberships.map((entry) => toOrganizationSummary(entry.organization)));
}));

/** Create a company, school, club or nonprofit page. The creator becomes its admin. */
organizationsRouter.post('/', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const input = emptyToUndefined(organizationInputSchema.parse(request.body));
    const existing = await prisma.organization.findUnique({where: {name_type: {name: input.name, type: input.type}}});
    if (existing) {
        const admins = await prisma.membership.count({where: {organizationId: existing.id, isAdmin: true}});
        // Pages created only as someone's past experience have no admin yet; let the first poster claim them.
        if (admins > 0) throw new HttpError(409, 'An organization with this name already exists');
    }

    const organization = existing
        ? await prisma.organization.update({
            where: {id: existing.id},
            data: {description: input.description, websiteUrl: input.websiteUrl, location: input.location},
        })
        : await prisma.organization.create({data: {...input, createdById: userId}});
    await prisma.membership.create({
        data: {userId, organizationId: organization.id, title: 'Admin', isAdmin: true},
    });
    response.status(201).json(toOrganizationSummary(organization));
}));

organizationsRouter.get('/:organizationId', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const organization = await prisma.organization.findUnique({
        where: {id: routeParam(request, 'organizationId')},
        include: {
            memberships: {
                select: {title: true, isAdmin: true, isCurrent: true, userId: true, user: {select: userSummarySelect}},
                orderBy: [{isAdmin: 'desc'}, {startedAt: 'asc'}],
            },
            posts: {select: projectCardSelect, where: {status: 'ACTIVE'}, orderBy: {createdAt: 'desc'}},
        },
    });
    if (!organization) throw new HttpError(404, 'Organization not found');

    const viewerMembership = organization.memberships.find((entry) => entry.userId === userId);
    const body: OrganizationDetail = {
        ...toOrganizationSummary(organization),
        description: organization.description ?? undefined,
        websiteUrl: organization.websiteUrl ?? undefined,
        location: organization.location ?? undefined,
        members: organization.memberships.map((entry) => ({
            user: toUserSummary(entry.user),
            title: entry.title,
            isAdmin: entry.isAdmin,
            isCurrent: entry.isCurrent,
        })),
        posts: organization.posts.map(toProjectCard),
        viewerIsAdmin: viewerMembership?.isAdmin ?? false,
    };
    response.json(body);
}));
