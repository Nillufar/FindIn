import type {ProjectSearchFilters, ProjectSearchResponse} from '@findin/shared';

function buildSearchParams(filters: ProjectSearchFilters): URLSearchParams {
    const params = new URLSearchParams();

    for (const tag of filters.tags) {
        params.append('tags', tag);
    }

    if (filters.fieldOfStudy) {
        params.set('fieldOfStudy', filters.fieldOfStudy);
    }

    if (filters.maxWeeklyHours !== undefined) {
        params.set('maxWeeklyHours', String(filters.maxWeeklyHours));
    }

    if (filters.sourceType) {
        params.set('sourceType', filters.sourceType);
    }

    if (filters.timeline) {
        params.set('timeline', filters.timeline);
    }

    params.set('limit', String(filters.limit));
    params.set('offset', String(filters.offset));

    return params;
}

export async function fetchProjectSearch(
    filters: ProjectSearchFilters,
    signal?: AbortSignal,
): Promise<ProjectSearchResponse> {
    const query = buildSearchParams(filters).toString();
    const response = await fetch(`/api/projects/search?${query}`, {signal});

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {error?: string} | null;
        throw new Error(body?.error ?? `Search failed (${response.status})`);
    }

    return (await response.json()) as ProjectSearchResponse;
}
