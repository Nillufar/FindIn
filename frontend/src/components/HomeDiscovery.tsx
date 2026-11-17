import {useMemo, useState, type ChangeEvent} from 'react';
import {
    SOURCE_TYPES,
    TIMELINE_CLASSES,
    type ProjectCard,
    type SourceType,
    type TimelineClass,
} from '@findin/shared';
import {
    emptyDiscoveryFilters,
    filtersFromSearchParams,
    useProjectSearch,
    type DiscoveryFilterState,
} from '../hooks/useProjectSearch';

const SOURCE_LABELS: Record<SourceType, string> = {
    OPEN_SOURCE: 'Open source',
    PRIVATE_SOURCE: 'Private source',
    PROPRIETARY: 'Proprietary',
};

const TIMELINE_LABELS: Record<TimelineClass, string> = {
    SHORT: 'Short',
    MEDIUM: 'Medium',
    LONG: 'Long',
};

function ProjectResultCard({project}: {project: ProjectCard}) {
    return (
        <article className="project-card">
            <header className="project-card__header">
                <h2>{project.title}</h2>
                <span className="project-card__badge">{SOURCE_LABELS[project.sourceType]}</span>
            </header>
            <p className="project-card__description">{project.description}</p>
            <dl className="project-card__meta">
                <div>
                    <dt>Field</dt>
                    <dd>{project.fieldOfStudy}</dd>
                </div>
                <div>
                    <dt>Hours / week</dt>
                    <dd>{project.minWeeklyHours}</dd>
                </div>
                <div>
                    <dt>Timeline</dt>
                    <dd>{TIMELINE_LABELS[project.timeline]}</dd>
                </div>
            </dl>
            <ul className="project-card__tags" aria-label="Required skills">
                {project.requiredSkills.map((skill) => (
                    <li key={skill}>{skill}</li>
                ))}
            </ul>
        </article>
    );
}

export function HomeDiscovery() {
    const initialFilters = useMemo(
        () => (typeof window === 'undefined' ? emptyDiscoveryFilters : filtersFromSearchParams(new URLSearchParams(window.location.search))),
        [],
    );
    const [filters, setFilters] = useState<DiscoveryFilterState>(initialFilters);
    const {data, error, loading} = useProjectSearch(filters);

    const updateField = (field: keyof DiscoveryFilterState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setFilters((current) => ({...current, [field]: value}));
    };

    const clearFilters = () => setFilters(emptyDiscoveryFilters);

    return (
        <main className="discovery">
            <header className="discovery__hero">
                <p className="eyebrow">FindIn discovery</p>
                <h1>Find projects that match your stack.</h1>
                <p className="intro">
                    Filter by technology tags, field of study, weekly hours, and commitment type. Results sync as you
                    type (FR-03).
                </p>
            </header>

            <section className="filter-panel" aria-label="Project filters">
                <label className="filter-field">
                    <span>Technology tags</span>
                    <input
                        type="text"
                        value={filters.tagsInput}
                        onChange={updateField('tagsInput')}
                        placeholder="react, typescript, node"
                        autoComplete="off"
                    />
                </label>

                <label className="filter-field">
                    <span>Field of study</span>
                    <input
                        type="text"
                        value={filters.fieldOfStudy}
                        onChange={updateField('fieldOfStudy')}
                        placeholder="Computer Science"
                        autoComplete="off"
                    />
                </label>

                <label className="filter-field">
                    <span>Max weekly hours</span>
                    <input
                        type="number"
                        min={1}
                        max={168}
                        value={filters.maxWeeklyHours}
                        onChange={updateField('maxWeeklyHours')}
                        placeholder="10"
                    />
                </label>

                <label className="filter-field">
                    <span>Commitment type</span>
                    <select value={filters.sourceType} onChange={updateField('sourceType')}>
                        <option value="">Any</option>
                        {SOURCE_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {SOURCE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="filter-field">
                    <span>Timeline</span>
                    <select value={filters.timeline} onChange={updateField('timeline')}>
                        <option value="">Any</option>
                        {TIMELINE_CLASSES.map((timeline) => (
                            <option key={timeline} value={timeline}>
                                {TIMELINE_LABELS[timeline]}
                            </option>
                        ))}
                    </select>
                </label>

                <button type="button" className="filter-clear" onClick={clearFilters}>
                    Clear filters
                </button>
            </section>

            <section className="results" aria-live="polite">
                <div className="results__status">
                    {loading && <span>Searching…</span>}
                    {!loading && data && (
                        <span>
                            {data.items.length} result{data.items.length === 1 ? '' : 's'}
                            {data.hasMore ? '+' : ''} · {data.tookMs} ms
                        </span>
                    )}
                    {error && <span className="results__error">{error}</span>}
                </div>

                {!loading && data?.items.length === 0 && (
                    <p className="results__empty">No active projects match these filters.</p>
                )}

                <div className="results__grid">
                    {data?.items.map((project) => (
                        <ProjectResultCard key={project.id} project={project} />
                    ))}
                </div>
            </section>
        </main>
    );
}
