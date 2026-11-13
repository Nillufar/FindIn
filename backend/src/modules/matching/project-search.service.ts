import type {ProjectCard, ProjectSearchFilters, ProjectSearchResponse} from '@findin/shared';
import {findProjectsByFilters, type ProjectSearchRow} from './project-search.repository.js';

function toProjectCard(row: ProjectSearchRow): ProjectCard {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        sourceType: row.sourceType,
        repositoryUrl: row.repositoryUrl ?? undefined,
        fieldOfStudy: row.fieldOfStudy,
        minWeeklyHours: row.minWeeklyHours,
        timeline: row.timeline,
        status: row.status,
        ownerId: row.ownerId,
        requiredSkills: row.requiredSkills.map((entry) => entry.skill),
        createdAt: row.createdAt.toISOString(),
    };
}

export async function searchProjects(filters: ProjectSearchFilters): Promise<ProjectSearchResponse> {
    const startedAt = performance.now();
    const rows = await findProjectsByFilters(filters);
    const tookMs = Math.round(performance.now() - startedAt);

    const hasMore = rows.length > filters.limit;
    const page = hasMore ? rows.slice(0, filters.limit) : rows;

    return {
        items: page.map(toProjectCard),
        hasMore,
        tookMs,
        limit: filters.limit,
        offset: filters.offset,
    };
}
