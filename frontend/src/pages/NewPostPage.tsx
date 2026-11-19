import {useState, type ChangeEvent, type FormEvent} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {
    ORGANIZATION_TYPES,
    POST_KINDS,
    SOURCE_TYPES,
    TIMELINE_CLASSES,
    type OrganizationType,
    type PostInput,
    type PostKind,
} from '@findin/shared';
import {describeError} from '../api/client';
import {organizationsApi, postsApi} from '../api/findin';
import {useAsync} from '../hooks/useAsync';
import {KIND_DESCRIPTIONS, KIND_LABELS, ORGANIZATION_TYPE_LABELS, SOURCE_LABELS, TIMELINE_LABELS, splitList} from '../lib/labels';

type FormState = {
    title: string;
    description: string;
    fieldOfStudy: string;
    minWeeklyHours: string;
    timeline: PostInput['timeline'];
    skills: string;
    location: string;
    compensation: string;
    organizationId: string;
    sourceType: string;
    repositoryUrl: string;
};

const EMPTY: FormState = {
    title: '', description: '', fieldOfStudy: '', minWeeklyHours: '5', timeline: 'MEDIUM', skills: '',
    location: '', compensation: '', organizationId: '', sourceType: '', repositoryUrl: '',
};

function readKind(value: string | null): PostKind {
    return POST_KINDS.includes(value as PostKind) ? (value as PostKind) : 'PROJECT';
}

export function NewPostPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [kind, setKind] = useState<PostKind>(readKind(params.get('kind')));
    const [form, setForm] = useState<FormState>({...EMPTY, organizationId: params.get('org') ?? ''});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const organizations = useAsync(() => organizationsApi.mine(), []);
    const needsOrganization = kind !== 'PROJECT';

    const update = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const created = await postsApi.create({
                kind,
                title: form.title,
                description: form.description,
                fieldOfStudy: form.fieldOfStudy,
                minWeeklyHours: Number(form.minWeeklyHours),
                timeline: form.timeline,
                requiredSkills: splitList(form.skills),
                location: form.location || undefined,
                compensation: kind === 'JOB' ? form.compensation || undefined : undefined,
                organizationId: form.organizationId || undefined,
                sourceType: kind === 'PROJECT' && form.sourceType ? form.sourceType as PostInput['sourceType'] : undefined,
                repositoryUrl: kind === 'PROJECT' ? form.repositoryUrl || undefined : undefined,
            });
            navigate(`/posts/${created.id}`);
        } catch (caught) {
            setError(describeError(caught));
            setSaving(false);
        }
    }

    return (
        <div className="form-page">
            <header className="page-hero page-hero--compact">
                <p className="eyebrow">New post</p>
                <h1>What are you looking for?</h1>
            </header>

            <div className="kind-picker" role="radiogroup" aria-label="Post type">
                {POST_KINDS.map((value) => (
                    <button key={value} type="button" role="radio" aria-checked={kind === value}
                            className={kind === value ? 'kind-option kind-option--active' : 'kind-option'}
                            onClick={() => setKind(value)}>
                        <strong>{value === 'PROJECT' ? 'Teammates' : value === 'JOB' ? 'Hire people' : 'Partners'}</strong>
                        <span className="kind-option__label">{KIND_LABELS[value]}</span>
                        <small>{KIND_DESCRIPTIONS[value]}</small>
                    </button>
                ))}
            </div>

            <form className="panel form" onSubmit={submit}>
                <label className="field">
                    <span>Title</span>
                    <input required minLength={3} maxLength={120} value={form.title} onChange={update('title')}
                           placeholder={kind === 'JOB' ? 'Marketing Intern' : kind === 'COLLABORATION' ? 'Cross-campus food drive' : 'Campus sustainability study'}/>
                </label>
                <label className="field">
                    <span>Description</span>
                    <textarea required minLength={10} rows={6} value={form.description} onChange={update('description')}
                              placeholder="What is it, who do you need, and what will they do?"/>
                </label>
                <div className="form-row">
                    <label className="field">
                        <span>Major / field</span>
                        <input required value={form.fieldOfStudy} onChange={update('fieldOfStudy')} placeholder="Any major, Nursing, Business…"/>
                    </label>
                    <label className="field field--small">
                        <span>Hours / week</span>
                        <input required type="number" min={1} max={80} value={form.minWeeklyHours} onChange={update('minWeeklyHours')}/>
                    </label>
                    <label className="field">
                        <span>Timeline</span>
                        <select value={form.timeline} onChange={update('timeline')}>
                            {TIMELINE_CLASSES.map((value) => <option key={value} value={value}>{TIMELINE_LABELS[value]}</option>)}
                        </select>
                    </label>
                </div>
                <label className="field">
                    <span>Skills wanted <em>(comma separated)</em></span>
                    <input value={form.skills} onChange={update('skills')} placeholder="writing, excel, photography"/>
                </label>
                <div className="form-row">
                    <label className="field">
                        <span>Location <em>(optional)</em></span>
                        <input value={form.location} onChange={update('location')} placeholder="Remote, or city"/>
                    </label>
                    {kind === 'JOB' && (
                        <label className="field">
                            <span>Pay <em>(optional)</em></span>
                            <input value={form.compensation} onChange={update('compensation')} placeholder="$18/hr"/>
                        </label>
                    )}
                </div>

                <fieldset className="fieldset">
                    <legend>{needsOrganization ? 'Posting for an organization' : 'Organization (optional)'}</legend>
                    <p className="muted">
                        {kind === 'JOB'
                            ? 'People you hire get “Works at …” this organization on their profile.'
                            : kind === 'COLLABORATION'
                                ? 'Partners who join are listed as collaborators of this organization.'
                                : 'Leave empty for a personal project.'}
                    </p>
                    <div className="form-row form-row--end">
                        <label className="field field--grow">
                            <span>Organization</span>
                            <select value={form.organizationId} onChange={update('organizationId')}>
                                <option value="">{needsOrganization ? 'Just me (no organization)' : 'None — personal project'}</option>
                                {organizations.data?.map((org) => (
                                    <option key={org.id} value={org.id}>{org.name} · {ORGANIZATION_TYPE_LABELS[org.type]}</option>
                                ))}
                            </select>
                        </label>
                        <Link className="button button--ghost" to={`/organizations/new?return=${encodeURIComponent(`/posts/new?kind=${kind}`)}`}>
                            + Create organization
                        </Link>
                    </div>
                </fieldset>

                {kind === 'PROJECT' && (
                    <details className="fieldset">
                        <summary>Is this a software project? (optional)</summary>
                        <div className="form-row">
                            <label className="field">
                                <span>Code visibility</span>
                                <select value={form.sourceType} onChange={update('sourceType')}>
                                    <option value="">Not a code project</option>
                                    {SOURCE_TYPES.map((value) => <option key={value} value={value}>{SOURCE_LABELS[value]}</option>)}
                                </select>
                            </label>
                            <label className="field field--grow">
                                <span>Repository link</span>
                                <input type="url" value={form.repositoryUrl} onChange={update('repositoryUrl')} placeholder="https://github.com/…"/>
                            </label>
                        </div>
                    </details>
                )}

                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="button-row">
                    <button className="button button--primary" disabled={saving}>{saving ? 'Posting…' : `Post ${KIND_LABELS[kind].toLowerCase()}`}</button>
                    <Link className="button button--ghost" to="/explore">Cancel</Link>
                </div>
            </form>
        </div>
    );
}

export function NewOrganizationPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [form, setForm] = useState({name: '', type: 'COMPANY' as OrganizationType, description: '', location: '', websiteUrl: ''});
    const [error, setError] = useState<string | null>(null);

    const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        try {
            const created = await organizationsApi.create({
                ...form,
                description: form.description || undefined,
                location: form.location || undefined,
                websiteUrl: form.websiteUrl || undefined,
            });
            const returnTo = params.get('return');
            // Only follow in-app paths so the link can't send people to another site.
            if (returnTo?.startsWith('/') && !returnTo.startsWith('//')) {
                navigate(`${returnTo}${returnTo.includes('?') ? '&' : '?'}org=${created.id}`);
            } else {
                navigate(`/organizations/${created.id}`);
            }
        } catch (caught) {
            setError(describeError(caught));
        }
    }

    return (
        <div className="form-page">
            <header className="page-hero page-hero--compact">
                <p className="eyebrow">New organization</p>
                <h1>Add your company, school or club</h1>
                <p className="page-hero__intro">You’ll be its admin, so you can post jobs and collaborations and send announcements to members.</p>
            </header>
            <form className="panel form" onSubmit={submit}>
                <div className="form-row">
                    <label className="field field--grow">
                        <span>Name</span>
                        <input required minLength={2} value={form.name} onChange={update('name')} placeholder="Bright Labs"/>
                    </label>
                    <label className="field">
                        <span>Type</span>
                        <select value={form.type} onChange={update('type')}>
                            {ORGANIZATION_TYPES.map((value) => <option key={value} value={value}>{ORGANIZATION_TYPE_LABELS[value]}</option>)}
                        </select>
                    </label>
                </div>
                <label className="field">
                    <span>About <em>(optional)</em></span>
                    <textarea rows={4} value={form.description} onChange={update('description')}/>
                </label>
                <div className="form-row">
                    <label className="field"><span>Location <em>(optional)</em></span>
                        <input value={form.location} onChange={update('location')}/></label>
                    <label className="field field--grow"><span>Website <em>(optional)</em></span>
                        <input type="url" value={form.websiteUrl} onChange={update('websiteUrl')} placeholder="https://"/></label>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="button-row">
                    <button className="button button--primary">Create organization</button>
                    <button type="button" className="button button--ghost" onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
