import {Link, useParams} from 'react-router-dom';
import {organizationsApi} from '../api/findin';
import {EmptyState, PageState, PersonLine, PostCard} from '../components/ui';
import {useAsync} from '../hooks/useAsync';
import {ORGANIZATION_TYPE_LABELS} from '../lib/labels';

export function OrganizationPage() {
    const {organizationId = ''} = useParams();
    const {data: organization, error, loading} = useAsync(() => organizationsApi.get(organizationId), [organizationId]);

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
                        <h2 className="section-title">Open cards</h2>
                        {organization.posts.length === 0 && <EmptyState title="No open cards right now"/>}
                        <div className="card-grid card-grid--narrow">
                            {organization.posts.map((post) => <PostCard key={post.id} post={post}/>)}
                        </div>
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
