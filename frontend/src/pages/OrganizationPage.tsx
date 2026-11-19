import {useState, type FormEvent} from 'react';
import {Link, useParams} from 'react-router-dom';
import type {OrganizationDetail} from '@findin/shared';
import {describeError} from '../api/client';
import {announcementsApi, organizationsApi} from '../api/findin';
import {EmptyState, PageState, PersonLine, PostCard} from '../components/ui';
import {useAsync} from '../hooks/useAsync';
import {ORGANIZATION_TYPE_LABELS} from '../lib/labels';
import {AnnouncementFeed} from './DashboardPage';

export function OrganizationPage() {
    const {organizationId = ''} = useParams();
    const {data: organization, error, loading, reload} = useAsync(() => organizationsApi.get(organizationId), [organizationId]);

    if (!organization) return <PageState loading={loading} error={error}/>;

    const current = organization.members.filter((member) => member.isCurrent);

    return (
        <div className="organization">
            <section className="panel org-hero">
                <span className="org-hero__mark" aria-hidden="true">{organization.name[0]}</span>
                <div>
                    <p className="eyebrow">{ORGANIZATION_TYPE_LABELS[organization.type]}</p>
                    <h1>{organization.name}</h1>
                    <p className="muted">
                        {[organization.location, `${current.length} ${current.length === 1 ? 'member' : 'members'} on FindIn`].filter(Boolean).join(' · ')}
                        {organization.websiteUrl && <> · <a href={organization.websiteUrl} target="_blank" rel="noreferrer">Website ↗</a></>}
                    </p>
                    {organization.description && <p className="prose">{organization.description}</p>}
                </div>
                {organization.viewerIsAdmin && (
                    <div className="org-hero__actions">
                        <Link className="button button--primary" to={`/posts/new?kind=JOB&org=${organization.id}`}>Post a job</Link>
                        <Link className="button button--ghost" to={`/posts/new?kind=COLLABORATION&org=${organization.id}`}>Find partners</Link>
                    </div>
                )}
            </section>

            <div className="profile__layout">
                <div className="stack stack--loose">
                    <section className="panel">
                        <h2 className="section-title">Open posts</h2>
                        {organization.posts.length === 0 && <EmptyState title="No open posts right now"/>}
                        <div className="card-grid card-grid--narrow">
                            {organization.posts.map((post) => <PostCard key={post.id} post={post}/>)}
                        </div>
                    </section>
                    <section className="panel">
                        <h2 className="section-title">Announcements</h2>
                        {organization.viewerIsAdmin && <AnnounceToMembers organization={organization} onPosted={reload}/>}
                        {organization.announcements.length === 0 && !organization.viewerIsAdmin
                            ? <p className="muted">Members see announcements here.</p>
                            : <AnnouncementFeed items={organization.announcements}/>}
                    </section>
                </div>
                <section className="panel">
                    <h2 className="section-title">People</h2>
                    <div className="stack">
                        {organization.members.map((member) => (
                            <PersonLine key={`${member.user.id}-${member.title}`} user={member.user}
                                        detail={`${member.title}${member.isCurrent ? '' : ' · past'}`}/>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function AnnounceToMembers({organization, onPosted}: { organization: OrganizationDetail; onPosted: () => void }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        try {
            await announcementsApi.create({title, body, organizationId: organization.id});
            setTitle('');
            setBody('');
            onPosted();
        } catch (caught) {
            setError(describeError(caught));
        }
    }

    return (
        <form className="announce-form" onSubmit={submit}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required/>
            <textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)}
                      placeholder={`Share an update with ${organization.name} members`} required/>
            <button className="button button--primary button--small">Post announcement</button>
            {error && <p className="form-error" role="alert">{error}</p>}
        </form>
    );
}
