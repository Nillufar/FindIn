import type {ProjectSearchFilters, ProjectSearchResponse} from '@findin/shared';
import {toProjectCard} from '../../lib/mappers.js';
import {findProjectsByFilters} from './project-search.repository.js';

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
