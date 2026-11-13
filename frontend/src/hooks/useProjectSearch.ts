import {useEffect, useState} from 'react';
import type {ProjectSearchFilters, ProjectSearchResponse} from '@findin/shared';
import {fetchProjectSearch} from '../api/projectSearch';

const DEFAULT_LIMIT = 20;

export type DiscoveryFilterState = {
    tagsInput: string;
    fieldOfStudy: string;
    maxWeeklyHours: string;
    sourceType: ProjectSearchFilters['sourceType'] | '';
    timeline: ProjectSearchFilters['timeline'] | '';
};

export const emptyDiscoveryFilters: DiscoveryFilterState = {
    tagsInput: '',
    fieldOfStudy: '',
    maxWeeklyHours: '',
    sourceType: '',
    timeline: '',
};

export function filtersFromSearchParams(params: URLSearchParams): DiscoveryFilterState {
    return {
        tagsInput: params.getAll('tags').join(', ') || params.get('tags') || '',
        fieldOfStudy: params.get('fieldOfStudy') ?? '',
        maxWeeklyHours: params.get('maxWeeklyHours') ?? '',
        sourceType: (params.get('sourceType') as DiscoveryFilterState['sourceType']) || '',
        timeline: (params.get('timeline') as DiscoveryFilterState['timeline']) || '',
    };
}

export function toSearchFilters(state: DiscoveryFilterState, offset = 0): ProjectSearchFilters {
    const tags = state.tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

    const maxWeeklyHours = state.maxWeeklyHours.trim() === '' ? undefined : Number(state.maxWeeklyHours);

    return {
        tags,
        fieldOfStudy: state.fieldOfStudy.trim() || undefined,
        maxWeeklyHours:
            maxWeeklyHours !== undefined && Number.isFinite(maxWeeklyHours) && maxWeeklyHours > 0
                ? Math.floor(maxWeeklyHours)
                : undefined,
        sourceType: state.sourceType || undefined,
        timeline: state.timeline || undefined,
        limit: DEFAULT_LIMIT,
        offset,
    };
}

export function syncFiltersToUrl(state: DiscoveryFilterState): void {
    const filters = toSearchFilters(state);
    const params = new URLSearchParams();

    for (const tag of filters.tags) {
        params.append('tags', tag);
    }
    if (filters.fieldOfStudy) params.set('fieldOfStudy', filters.fieldOfStudy);
    if (filters.maxWeeklyHours !== undefined) params.set('maxWeeklyHours', String(filters.maxWeeklyHours));
    if (filters.sourceType) params.set('sourceType', filters.sourceType);
    if (filters.timeline) params.set('timeline', filters.timeline);

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
}

type SearchState = {
    data: ProjectSearchResponse | null;
    error: string | null;
    loading: boolean;
};

/**
 * Debounced project search with abortable in-flight requests and URL sync.
 */
export function useProjectSearch(filters: DiscoveryFilterState, debounceMs = 300): SearchState {
    const [state, setState] = useState<SearchState>({
        data: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        const controller = new AbortController();
        const handle = window.setTimeout(async () => {
            syncFiltersToUrl(filters);
            setState((current) => ({...current, loading: true, error: null}));

            try {
                const data = await fetchProjectSearch(toSearchFilters(filters), controller.signal);
                setState({data, error: null, loading: false});
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setState({
                    data: null,
                    error: error instanceof Error ? error.message : 'Search failed',
                    loading: false,
                });
            }
        }, debounceMs);

        return () => {
            controller.abort();
            window.clearTimeout(handle);
        };
    }, [filters, debounceMs]);

    return state;
}
