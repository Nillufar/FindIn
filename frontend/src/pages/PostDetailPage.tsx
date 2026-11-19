import {useState, type FormEvent} from 'react';
import {Link, useParams} from 'react-router-dom';
import type {InvitationView, PostDetail, UserSummary} from '@findin/shared';
import {describeError} from '../api/client';
import {invitationsApi, postsApi, usersApi} from '../api/findin';
import {KindBadge, PageState, PersonLine, StatusPill, Tags} from '../components/ui';
import {useAsync} from '../hooks/useAsync';
import {PAID_POSITION_DISCLAIMER, SOURCE_LABELS, TIMELINE_LABELS, joinVerb, timeAgo} from '../lib/labels';

export function PostDetailPage() {
    const {postId = ''} = useParams();
    const {data: post, error, loading, reload} = useAsync(() => postsApi.get(postId), [postId]);

    if (!post) return <PageState loading={loading} error={error}/>;

    const isPaid = post.kind === 'JOB' || Boolean(post.compensation);

    return (
        <div className="detail">
            <Link className="back-link" to={`/explore?tab=${post.kind === 'JOB' ? 'jobs' : post.kind === 'COLLABORATION' ? 'collaborations' : 'projects'}`}>
                ← Back to Explore
            </Link>
            <div className="detail__layout">
                <article className="panel detail__main">
                    <div className="detail__badges">
                        <KindBadge kind={post.kind}/>
                        {post.sourceType && <span className="source-pill">{SOURCE_LABELS[post.sourceType]}</span>}
                        {post.status !== 'ACTIVE' && <span className="status-pill status-pill--cancelled">Closed</span>}
                    </div>
                    <h1>{post.title}</h1>
                    <p className="detail__by">
                        Posted by <Link to={`/people/${post.owner.id}`}>{post.owner.displayName}</Link>
                        {post.organization && <> for <Link to={`/organizations/${post.organization.id}`}>{post.organization.name}</Link></>}
                        {' · '}{timeAgo(post.createdAt)}
                    </p>
                    <dl className="fact-grid">
                        <div><dt>Field</dt><dd>{post.fieldOfStudy}</dd></div>
                        <div><dt>Hours / week</dt><dd>{post.minWeeklyHours}+</dd></div>
                        <div><dt>Timeline</dt><dd>{TIMELINE_LABELS[post.timeline]}</dd></div>
                        {post.location && <div><dt>Location</dt><dd>{post.location}</dd></div>}
                        {post.compensation && <div><dt>Pay</dt><dd>{post.compensation}</dd></div>}
                        {post.sourceType && <div><dt>Code</dt><dd>{SOURCE_LABELS[post.sourceType]}</dd></div>}
                    </dl>
                    <p className="detail__description">{post.description}</p>
                    {post.requiredSkills.length > 0 && <>
                        <h2 className="section-title">Skills wanted</h2>
                        <Tags items={post.requiredSkills} label="Skills wanted"/>
                    </>}
                    {post.repositoryUrl && <p><a href={post.repositoryUrl} target="_blank" rel="noreferrer">Repository ↗</a></p>}
                    {isPaid && <p className="paid-disclaimer paid-disclaimer--detail">{PAID_POSITION_DISCLAIMER}</p>}
                </article>

                <aside className="detail__side">
                    {post.viewerIsOwner
                        ? <OwnerPanel post={post} onChange={reload}/>
                        : <JoinPanel post={post} onChange={reload}/>}
                    <section className="panel">
                        <h2 className="section-title">Team · {post.team.length}</h2>
                        <div className="stack">
                            {post.team.map((member, index) => (
                                <PersonLine key={member.id} user={member} detail={index === 0 ? 'Owner' : undefined}/>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function JoinPanel({post, onChange}: { post: PostDetail; onChange: () => void }) {
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const invitation = post.viewerInvitation;

    async function run(action: () => Promise<unknown>) {
        setBusy(true);
        setError(null);
        try {
            await action();
            onChange();
        } catch (caught) {
            setError(describeError(caught));
        } finally {
            setBusy(false);
        }
    }

    if (invitation?.status === 'ACCEPTED') {
        return (
            <section className="panel join-panel join-panel--done">
                <h2>{post.kind === 'JOB' ? 'You were hired 🎉' : 'You are on this team'}</h2>
                <p>{post.kind === 'JOB' && post.organization
                    ? `${post.organization.name} now shows on your profile.`
                    : 'You can coordinate with teammates from this card and your dashboard.'}</p>
            </section>
        );
    }

    if (invitation?.status === 'PENDING' && invitation.type === 'INVITE') {
        return (
            <section className="panel join-panel">
                <h2>{invitation.inviter.displayName} invited you</h2>
                {invitation.message && <blockquote>“{invitation.message}”</blockquote>}
                <div className="button-row">
                    <button className="button button--primary" disabled={busy}
                            onClick={() => run(() => invitationsApi.respond(invitation.id, 'ACCEPT'))}>Accept
                    </button>
                    <button className="button button--ghost" disabled={busy}
                            onClick={() => run(() => invitationsApi.respond(invitation.id, 'DECLINE'))}>Decline
                    </button>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
            </section>
        );
    }

    if (invitation?.status === 'PENDING') {
        return (
            <section className="panel join-panel">
                <h2>{post.kind === 'JOB' ? 'Application sent' : 'Request sent'}</h2>
                <p>Sent {timeAgo(invitation.createdAt)}. You’ll see the answer on your dashboard.</p>
                <button className="button button--ghost" disabled={busy}
                        onClick={() => run(() => invitationsApi.cancel(invitation.id))}>Withdraw
                </button>
                {error && <p className="form-error" role="alert">{error}</p>}
            </section>
        );
    }

    if (post.status !== 'ACTIVE') {
        return <section className="panel join-panel"><h2>This card is closed</h2></section>;
    }

    return (
        <form className="panel join-panel" onSubmit={(event) => {
            event.preventDefault();
            void run(() => postsApi.requestToJoin(post.id, message || undefined));
        }}>
            <h2>{post.kind === 'JOB' ? 'Interested in this job?' : 'Want to join?'}</h2>
            {invitation?.status === 'DECLINED' && <p className="muted">Your last request was declined. You can try again.</p>}
            <label className="field">
                <span>Message to {post.owner.displayName.split(' ')[0]} (optional)</span>
                <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)}
                          placeholder="Say what you’d bring to the team"/>
            </label>
            <button className="button button--primary button--block" disabled={busy}>{joinVerb(post.kind)}</button>
            {error && <p className="form-error" role="alert">{error}</p>}
        </form>
    );
}

function OwnerPanel({post, onChange}: { post: PostDetail; onChange: () => void }) {
    const [error, setError] = useState<string | null>(null);
    const pending = post.invitations.filter((entry) => entry.status === 'PENDING' && entry.type === 'REQUEST');
    const invited = post.invitations.filter((entry) => entry.type === 'INVITE' && entry.status === 'PENDING');

    async function respond(entry: InvitationView, decision: 'ACCEPT' | 'DECLINE') {
        setError(null);
        try {
            await invitationsApi.respond(entry.id, decision);
            onChange();
        } catch (caught) {
            setError(describeError(caught));
        }
    }

    return (
        <>
            <section className="panel">
                <h2 className="section-title">{post.kind === 'JOB' ? 'Applicants' : 'Requests to join'} · {pending.length}</h2>
                {pending.length === 0 && <p className="muted">No one is waiting right now.</p>}
                <div className="stack">
                    {pending.map((entry) => (
                        <div key={entry.id} className="request-item">
                            <PersonLine user={entry.applicant}/>
                            {entry.message && <blockquote>“{entry.message}”</blockquote>}
                            <div className="button-row">
                                <button className="button button--primary button--small" onClick={() => respond(entry, 'ACCEPT')}>
                                    {post.kind === 'JOB' ? 'Hire' : 'Accept'}
                                </button>
                                <button className="button button--ghost button--small" onClick={() => respond(entry, 'DECLINE')}>Decline</button>
                            </div>
                        </div>
                    ))}
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
            </section>
            {post.status === 'ACTIVE' && <InvitePeople post={post} pendingInvites={invited} onInvited={onChange}/>}
            {post.status === 'ACTIVE' && (
                <button className="button button--ghost button--block" onClick={async () => {
                    if (!window.confirm('Close this card? It will stop showing in Explore.')) return;
                    await postsApi.close(post.id);
                    onChange();
                }}>Close card</button>
            )}
        </>
    );
}

function InvitePeople({post, pendingInvites, onInvited}: {
    post: PostDetail;
    pendingInvites: InvitationView[];
    onInvited: () => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSummary[]>([]);
    const [notice, setNotice] = useState<string | null>(null);
    const unavailable = new Set(post.invitations.filter((entry) => entry.status !== 'DECLINED' && entry.status !== 'CANCELLED')
        .map((entry) => entry.applicant.id));

    async function search(event: FormEvent) {
        event.preventDefault();
        setNotice(null);
        try {
            const response = await usersApi.search({q: query || undefined, limit: 6, offset: 0});
            setResults(response.items);
            if (response.items.length === 0) setNotice('No one found. Try a major or skill.');
        } catch (caught) {
            setNotice(describeError(caught));
        }
    }

    async function invite(user: UserSummary) {
        try {
            await postsApi.invite(post.id, user.id);
            setNotice(`Invitation sent to ${user.displayName}.`);
            onInvited();
        } catch (caught) {
            setNotice(describeError(caught));
        }
    }

    return (
        <section className="panel">
            <h2 className="section-title">Invite people</h2>
            <form className="inline-form" onSubmit={search}>
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                       placeholder="Name, major or skill" aria-label="Search people to invite"/>
                <button className="button button--ghost button--small">Search</button>
            </form>
            <div className="stack">
                {results.map((user) => (
                    <div key={user.id} className="invite-row">
                        <PersonLine user={user}/>
                        <button className="button button--small" disabled={unavailable.has(user.id) || post.team.some((member) => member.id === user.id)}
                                onClick={() => invite(user)}>
                            {unavailable.has(user.id) ? 'Invited' : 'Invite'}
                        </button>
                    </div>
                ))}
            </div>
            {notice && <p className="muted" role="status">{notice}</p>}
            {pendingInvites.length > 0 && (
                <div className="stack stack--tight">
                    <p className="small-label">Waiting for reply</p>
                    {pendingInvites.map((entry) => (
                        <div key={entry.id} className="invite-row">
                            <PersonLine user={entry.applicant}/>
                            <StatusPill status={entry.status}/>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
