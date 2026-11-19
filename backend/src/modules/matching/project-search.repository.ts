import type {Prisma} from '@prisma/client';
import type {ProjectSearchFilters} from '@findin/shared';
import {prisma} from '../../lib/prisma.js';
import {projectCardSelect} from '../../lib/mappers.js';

function buildWhere(filters: ProjectSearchFilters): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
        status: 'ACTIVE',
    };

    if (filters.kind) {
        where.kind = filters.kind;
    }

    if (filters.q) {
        where.OR = [
            {title: {contains: filters.q, mode: 'insensitive'}},
            {description: {contains: filters.q, mode: 'insensitive'}},
            {organization: {name: {contains: filters.q, mode: 'insensitive'}}},
        ];
    }

    if (filters.fieldOfStudy) {
        // Partial match so "Bio" finds "Biology" and "Biomedical Engineering".
        where.fieldOfStudy = {contains: filters.fieldOfStudy, mode: 'insensitive'};
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
