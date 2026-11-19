import {useEffect, useMemo, useState, type ChangeEvent} from 'react';
import {Link} from 'react-router-dom';
import {SOURCE_TYPES, TIMELINE_CLASSES, type PostKind, type UserSummary} from '@findin/shared';
import {describeError} from '../api/client';
import {usersApi} from '../api/findin';
import {EmptyState, PersonCard, PostCard} from '../components/ui';
import {
    emptyDiscoveryFilters,
    filtersFromSearchParams,
    useProjectSearch,
    type DiscoveryFilterState,
} from '../hooks/useProjectSearch';
import {SOURCE_LABELS, TIMELINE_LABELS} from '../lib/labels';

type Tab = 'projects' | 'jobs' | 'collaborations' | 'people';

const TABS: Array<{ id: Tab; label: string; kind?: PostKind; blurb: string }> = [
    {id: 'projects', label: 'Projects', kind: 'PROJECT', blurb: 'Find teammates and ask to join a project.'},
    {id: 'jobs', label: 'Jobs', kind: 'JOB', blurb: 'Paid roles from companies, labs and campus organizations.'},
    {id: 'collaborations', label: 'Collaborations', kind: 'COLLABORATION', blurb: 'Partner with clubs, schools and organizations.'},
    {id: 'people', label: 'People', blurb: 'Search students by major, school or skill and invite them.'},
];

function readTab(): Tab {
    const value = new URLSearchParams(window.location.search).get('tab');
    return TABS.some((tab) => tab.id === value) ? (value as Tab) : 'projects';
}

export function ExplorePage() {
    const [tab, setTab] = useState<Tab>(readTab);
    const active = TABS.find((entry) => entry.id === tab)!;

    function selectTab(next: Tab) {
        setTab(next);
        const params = new URLSearchParams(window.location.search);
        params.set('tab', next);
        window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
    }

    return (
        <div className="explore">
            <header className="page-hero">
                <p className="eyebrow">Explore</p>
                <h1>Find your team.</h1>
                <p className="page-hero__intro">Teammates for a project, a paid role, or a partner at another school.</p>
            </header>

            <div className="tabs" role="tablist" aria-label="What to explore">
                {TABS.map((entry) => (
                    <button key={entry.id} type="button" role="tab" aria-selected={entry.id === tab}
                            className={entry.id === tab ? 'tab tab--active' : 'tab'} onClick={() => selectTab(entry.id)}>
                        {entry.label}
                    </button>
                ))}
                <Link className="button button--primary tabs__cta" to={`/posts/new${active.kind ? `?kind=${active.kind}` : ''}`}>
                    + New post
                </Link>
            </div>
            <p className="tabs__blurb">{active.blurb}</p>

            {active.kind ? <PostResults kind={active.kind}/> : <PeopleResults/>}
        </div>
    );
}

function PostResults({kind}: { kind: PostKind }) {
    const initialFilters = useMemo(() => filtersFromSearchParams(new URLSearchParams(window.location.search)), []);
    const [filters, setFilters] = useState<DiscoveryFilterState>(initialFilters);
    const {data, error, loading} = useProjectSearch(filters, kind);

    const update = (field: keyof DiscoveryFilterState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFilters((current) => ({...current, [field]: event.target.value}));

    return (
        <>
            <section className="filter-bar" aria-label="Filters">
                <label className="field field--grow">
                    <span>Search</span>
                    <input type="search" value={filters.q} onChange={update('q')}
                           placeholder={kind === 'JOB' ? 'Role or company' : 'Keywords'}/>
                </label>
                <label className="field">
                    <span>Skills</span>
                    <input value={filters.tagsInput} onChange={update('tagsInput')}
                           placeholder="python, react, c++, firmware"/>
                </label>
                <label className="field">
                    <span>Major / field</span>
                    <input value={filters.fieldOfStudy} onChange={update('fieldOfStudy')}
                           placeholder="Computer Science"/>
                </label>
                {kind === 'PROJECT' && (
                    <label className="field">
                        <span>Source</span>
                        <select value={filters.sourceType} onChange={update('sourceType')}>
                            <option value="">Any</option>
                            {SOURCE_TYPES.map((value) => (
                                <option key={value} value={value}>{SOURCE_LABELS[value]}</option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="field field--small">
                    <span>Max hrs/week</span>
                    <input type="number" min={1} max={80} value={filters.maxWeeklyHours} onChange={update('maxWeeklyHours')}
                           placeholder="10"/>
                </label>
                <label className="field">
                    <span>Timeline</span>
                    <select value={filters.timeline} onChange={update('timeline')}>
                        <option value="">Any</option>
                        {TIMELINE_CLASSES.map((value) => <option key={value} value={value}>{TIMELINE_LABELS[value]}</option>)}
                    </select>
                </label>
                <button type="button" className="button button--ghost" onClick={() => setFilters(emptyDiscoveryFilters)}>Clear</button>
            </section>

            <p className="results-count" aria-live="polite">
                {loading ? 'Searching…' : error ? '' : `${data?.items.length ?? 0}${data?.hasMore ? '+' : ''} results`}
            </p>
            {error && <p className="page-state page-state--error" role="alert">{error}</p>}
            {!loading && data?.items.length === 0 && (
                <EmptyState title="Nothing matches yet">Try fewer filters, or be the first to post one.</EmptyState>
            )}
            <div className="card-grid">
                {data?.items.map((post) => <PostCard key={post.id} post={post}/>)}
            </div>
        </>
    );
}

function PeopleResults() {
    const [filters, setFilters] = useState({q: '', major: '', university: '', skill: ''});
    const [people, setPeople] = useState<UserSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const handle = window.setTimeout(() => {
            usersApi.search({...filters, limit: 24, offset: 0}, controller.signal)
                .then((result) => {
                    setPeople(result.items);
                    setError(null);
                })
                .catch((caught) => !controller.signal.aborted && setError(describeError(caught)));
        }, 250);
        return () => {
            controller.abort();
            window.clearTimeout(handle);
        };
    }, [filters]);

    const update = (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) =>
        setFilters((current) => ({...current, [field]: event.target.value}));

    return (
        <>
            <section className="filter-bar" aria-label="People filters">
                <label className="field field--grow">
                    <span>Search</span>
                    <input type="search" value={filters.q} onChange={update('q')} placeholder="Name, major or skill"/>
                </label>
                <label className="field"><span>Major</span>
                    <input value={filters.major} onChange={update('major')} placeholder="Computer Science"/></label>
                <label className="field"><span>School</span>
                    <input value={filters.university} onChange={update('university')} placeholder="CSUSB"/></label>
                <label className="field"><span>Skill</span>
                    <input value={filters.skill} onChange={update('skill')} placeholder="react"/></label>
            </section>
            {error && <p className="page-state page-state--error" role="alert">{error}</p>}
            {people?.length === 0 && <EmptyState title="No one matches yet">Try a broader search.</EmptyState>}
            <div className="card-grid card-grid--people">
                {people?.map((person) => <PersonCard key={person.id} user={person}/>)}
            </div>
        </>
    );
}
