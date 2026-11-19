import {Router} from 'express';
import {z} from 'zod';
import {ORGANIZATION_TYPES, type PeopleSearchResponse, type UserProfile} from '@findin/shared';
import {HttpError} from '../../lib/http-error.js';
import {prisma} from '../../lib/prisma.js';
import {
    emptyToUndefined,
    membershipSelect,
    normalizeTags,
    projectCardSelect,
    toMembershipView,
    toProjectCard,
    toUserSummary,
    userSummarySelect,
} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser, routeParam} from '../../middleware/auth.js';

export const usersRouter = Router();

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalUrl = z.union([z.literal(''), z.string().trim().url().max(300)]).optional();
const tagList = z.array(z.string().max(48)).max(30).default([]);

const profileUpdateSchema = z.object({
    displayName: z.string().trim().min(1).max(80),
    headline: optionalText(120),
    bio: optionalText(1200),
    university: optionalText(120),
    major: optionalText(120),
    graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
    interests: tagList,
    skills: tagList,
    linkedinUrl: optionalUrl,
    githubUrl: optionalUrl,
    websiteUrl: optionalUrl,
    resumeUrl: optionalUrl,
});

const experienceSchema = z.object({
    organizationName: z.string().trim().min(1).max(120),
    organizationType: z.enum(ORGANIZATION_TYPES),
    title: z.string().trim().min(1).max(120),
    isCurrent: z.boolean().default(true),
});

const peopleSearchSchema = z.object({
    q: z.string().trim().max(120).optional(),
    major: z.string().trim().max(120).optional(),
    university: z.string().trim().max(120).optional(),
    skill: z.string().trim().max(48).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(24),
    offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

/** Builds the full profile. `includePrivate` adds the email, which only the owner sees. */
export async function loadUserProfile(userId: string, includePrivate: boolean): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        include: {
            memberships: {
                select: membershipSelect,
                orderBy: [{isCurrent: 'desc'}, {startedAt: 'desc'}],
            },
            projects: {
                select: projectCardSelect,
                where: {status: 'ACTIVE'},
                orderBy: {createdAt: 'desc'},
            },
            applications: {
                where: {status: 'ACCEPTED'},
                select: {project: {select: projectCardSelect}},
                orderBy: {updatedAt: 'desc'},
            },
        },
    });
    if (!user) throw new HttpError(404, 'Profile not found');

    return {
        ...toUserSummary(user),
        email: includePrivate ? user.email : undefined,
        bio: user.bio ?? undefined,
        graduationYear: user.graduationYear ?? undefined,
        interests: user.interests,
        skills: user.skills,
        linkedinUrl: user.linkedinUrl ?? undefined,
        githubUrl: user.githubUrl ?? undefined,
        websiteUrl: user.websiteUrl ?? undefined,
        resumeUrl: user.resumeUrl ?? undefined,
        memberships: user.memberships.map(toMembershipView),
        posts: user.projects.map(toProjectCard),
        teams: user.applications.map((entry) => toProjectCard(entry.project)),
        isProfileComplete: Boolean(user.university && user.major),
    };
}

usersRouter.get('/me', requireUser, asyncHandler(async (request, response) => {
    response.json(await loadUserProfile(currentUserId(request), true));
}));

usersRouter.put('/me', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const input = emptyToUndefined(profileUpdateSchema.parse(request.body));
    await prisma.user.update({
        where: {id: userId},
        data: {
            displayName: input.displayName,
            headline: input.headline ?? null,
            bio: input.bio ?? null,
            university: input.university ?? null,
            major: input.major ?? null,
            graduationYear: input.graduationYear ?? null,
            interests: normalizeTags(input.interests),
            skills: normalizeTags(input.skills),
            linkedinUrl: input.linkedinUrl ?? null,
            githubUrl: input.githubUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            resumeUrl: input.resumeUrl ?? null,
        },
    });
    response.json(await loadUserProfile(userId, true));
}));

/** Adds a role the person already has, e.g. "Barista at Campus Café" or "Member of Chess Club". */
usersRouter.post('/me/experience', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const input = experienceSchema.parse(request.body);
    const organization = await prisma.organization.upsert({
        where: {name_type: {name: input.organizationName, type: input.organizationType}},
        update: {},
        create: {name: input.organizationName, type: input.organizationType, createdById: userId},
    });
    await prisma.membership.create({
        data: {
            userId,
            organizationId: organization.id,
            title: input.title,
            isCurrent: input.isCurrent,
            endedAt: input.isCurrent ? null : new Date(),
        },
    });
    response.status(201).json(await loadUserProfile(userId, true));
}));

usersRouter.delete('/me/experience/:membershipId', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const result = await prisma.membership.deleteMany({where: {id: routeParam(request, 'membershipId'), userId}});
    if (result.count === 0) throw new HttpError(404, 'Experience not found');
    response.json(await loadUserProfile(userId, true));
}));

usersRouter.get('/search', requireUser, asyncHandler(async (request, response) => {
    const filters = peopleSearchSchema.parse(request.query);
    const contains = (value: string) => ({contains: value, mode: 'insensitive' as const});
    const users = await prisma.user.findMany({
        where: {
            id: {not: currentUserId(request)},
            ...(filters.major ? {major: contains(filters.major)} : {}),
            ...(filters.university ? {university: contains(filters.university)} : {}),
            ...(filters.skill ? {skills: {has: filters.skill.toLowerCase()}} : {}),
            ...(filters.q ? {
                OR: [
                    {displayName: contains(filters.q)},
                    {headline: contains(filters.q)},
                    {major: contains(filters.q)},
                    {university: contains(filters.q)},
                    {skills: {has: filters.q.toLowerCase()}},
                    {interests: {has: filters.q.toLowerCase()}},
                ],
            } : {}),
        },
        select: userSummarySelect,
        orderBy: [{updatedAt: 'desc'}, {id: 'asc'}],
        take: filters.limit + 1,
        skip: filters.offset,
    });
    const hasMore = users.length > filters.limit;
    const body: PeopleSearchResponse = {items: users.slice(0, filters.limit).map(toUserSummary), hasMore};
    response.json(body);
}));

usersRouter.get('/:userId', requireUser, asyncHandler(async (request, response) => {
    const userId = routeParam(request, 'userId');
    response.json(await loadUserProfile(userId, userId === currentUserId(request)));
}));
