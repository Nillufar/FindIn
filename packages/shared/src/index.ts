export type ApiHealthResponse = {
    status: 'ok';
    service: string;
    timestamp: string;
};

export const SOURCE_TYPES = ['OPEN_SOURCE', 'PRIVATE_SOURCE', 'PROPRIETARY'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const TIMELINE_CLASSES = ['SHORT', 'MEDIUM', 'LONG'] as const;
export type TimelineClass = (typeof TIMELINE_CLASSES)[number];

export const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Public project-card shape returned by discovery/search (DR-01). */
export type ProjectCard = {
    id: string;
    title: string;
    description: string;
    sourceType: SourceType;
    repositoryUrl?: string;
    fieldOfStudy: string;
    minWeeklyHours: number;
    timeline: TimelineClass;
    status: ProjectStatus;
    ownerId: string;
    requiredSkills: string[];
    createdAt: string;
};

/** FR-03 filter criteria for multi-tag project discovery. */
export type ProjectSearchFilters = {
    tags: string[];
    fieldOfStudy?: string;
    maxWeeklyHours?: number;
    sourceType?: SourceType;
    timeline?: TimelineClass;
    limit: number;
    offset: number;
};

export type ProjectSearchResponse = {
    items: ProjectCard[];
    hasMore: boolean;
    /** Server-side query duration for NFR-03 observability. */
    tookMs: number;
    limit: number;
    offset: number;
};
