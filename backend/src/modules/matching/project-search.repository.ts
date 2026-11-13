import type {Prisma} from '@prisma/client';
import type {ProjectSearchFilters} from '@findin/shared';
import {prisma} from '../../lib/prisma.js';

function buildWhere(filters: ProjectSearchFilters): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
        status: 'ACTIVE',
    };

    if (filters.fieldOfStudy) {
        where.fieldOfStudy = {equals: filters.fieldOfStudy, mode: 'insensitive'};
    }

    if (filters.maxWeeklyHours !== undefined) {
        // User's maximum weekly hours: only show projects that require at most that commitment.
        where.minWeeklyHours = {lte: filters.maxWeeklyHours};
    }

    if (filters.sourceType) {
        where.sourceType = filters.sourceType;
    }

    if (filters.timeline) {
        where.timeline = filters.timeline;
    }

    if (filters.tags.length > 0) {
        // AND across tags via indexed EXISTS lookups on ProjectRequiredSkill.skill.
        where.AND = filters.tags.map((skill) => ({
            requiredSkills: {
                some: {skill},
            },
        }));
    }

    return where;
}

const projectCardSelect = {
    id: true,
    title: true,
    description: true,
    sourceType: true,
    repositoryUrl: true,
    fieldOfStudy: true,
    minWeeklyHours: true,
    timeline: true,
    status: true,
    ownerId: true,
    createdAt: true,
    requiredSkills: {
        select: {skill: true},
        orderBy: {skill: 'asc' as const},
    },
} satisfies Prisma.ProjectSelect;

export type ProjectSearchRow = Prisma.ProjectGetPayload<{select: typeof projectCardSelect}>;

/**
 * Fetch one extra row to compute hasMore without a separate COUNT(*) (NFR-03).
 */
export async function findProjectsByFilters(filters: ProjectSearchFilters): Promise<ProjectSearchRow[]> {
    return prisma.project.findMany({
        where: buildWhere(filters),
        select: projectCardSelect,
        orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
        take: filters.limit + 1,
        skip: filters.offset,
    });
}
