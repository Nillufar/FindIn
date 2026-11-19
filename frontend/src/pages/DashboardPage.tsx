import {useState, type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import type {InvitationView} from '@findin/shared';
import {describeError} from '../api/client';
import {dashboardApi, invitationsApi} from '../api/findin';
import {EmptyState, KindBadge, PageState, PersonLine, PostCard, StatusPill} from '../components/ui';
import {useCurrentUser} from '../features/auth/session';
import {useAsync} from '../hooks/useAsync';
import {timeAgo} from '../lib/labels';

type Section = 'requests' | 'applied' | 'invitations' | 'cards';

export function DashboardPage() {
    const me = useCurrentUser();
    const {data, error, loading, reload} = useAsync(() => dashboardApi.get(), []);
    const [section, setSection] = useState<Section>('requests');
    const [actionError, setActionError] = useState<string | null>(null);

    if (!data) return <PageState loading={loading} error={error}/>;

    const pendingRequests = data.requests.filter((entry) => entry.status === 'PENDING');
    const pendingInvitations = data.invitations.filter((entry) => entry.status === 'PENDING');
    const waitingApplications = data.applied.filter((entry) => entry.status === 'PENDING');

    async function act(action: () => Promise<unknown>) {
        setActionError(null);
        try {
            await action();
            reload();
        } catch (caught) {
            setActionError(describeError(caught));
        }
    }

    const sections: Array<{ id: Section; label: string; count: number }> = [
        {id: 'requests', label: 'Requests to review', count: pendingRequests.length},
        {id: 'applied', label: 'Applied', count: data.applied.length},
        {id: 'invitations', label: 'Invitations', count: pendingInvitations.length},
        {id: 'cards', label: 'My cards', count: data.myPosts.length},
    ];

    return (
        <div className="dashboard">
            <header className="page-hero page-hero--compact">
                <p className="eyebrow">Dashboard</p>
                <h1>Hi {me.displayName.split(' ')[0]}, here’s what’s happening.</h1>
            </header>

            <div className="stat-row">
                <Stat label="Need your answer" value={pendingRequests.length + pendingInvitations.length}
                      onClick={() => setSection(pendingRequests.length ? 'requests' : 'invitations')}/>
                <Stat label="Applications waiting" value={waitingApplications.length} onClick={() => setSection('applied')}/>
                <Stat label="Open cards" value={data.myPosts.length} onClick={() => setSection('cards')}/>
            </div>

            <section className="panel">
                <div className="tabs tabs--inline" role="tablist" aria-label="Dashboard sections">
                    {sections.map((entry) => (
                        <button key={entry.id} type="button" role="tab" aria-selected={section === entry.id}
                                className={section === entry.id ? 'tab tab--active' : 'tab'} onClick={() => setSection(entry.id)}>
                            {entry.label}{entry.count > 0 && <span className="tab__count">{entry.count}</span>}
                        </button>
                    ))}
                </div>
                {actionError && <p className="form-error" role="alert">{actionError}</p>}

                {section === 'requests' && (
                    <InvitationList items={data.requests} empty="No one has asked to join your cards yet."
                                    render={(entry) => (
                                        <>
                                            <PersonLine user={entry.applicant}/>
                                            <p className="invitation__what">
                                                {entry.post.kind === 'JOB' ? 'applied to' : 'asked to join'} <Link to={`/posts/${entry.post.id}`}>{entry.post.title}</Link>
                                            </p>
                                            {entry.message && <blockquote>“{entry.message}”</blockquote>}
                                            {entry.status === 'PENDING' ? (
                                                <div className="button-row">
                                                    <button className="button button--primary button--small"
                                                            onClick={() => act(() => invitationsApi.respond(entry.id, 'ACCEPT'))}>
                                                        {entry.post.kind === 'JOB' ? 'Hire' : 'Accept'}
                                                    </button>
                                                    <button className="button button--ghost button--small"
                                                            onClick={() => act(() => invitationsApi.respond(entry.id, 'DECLINE'))}>Decline
                                                    </button>
                                                </div>
                                            ) : <StatusPill status={entry.status}/>}
                                        </>
                                    )}/>
                )}

                {section === 'applied' && (
                    <InvitationList items={data.applied} empty="You haven’t applied to anything yet."
                                    emptyAction={<Link className="button button--primary" to="/explore">Explore cards</Link>}
                                    render={(entry) => (
                                        <>
                                            <div className="invitation__post">
                                                <KindBadge kind={entry.post.kind}/>
                                                <Link to={`/posts/${entry.post.id}`}><strong>{entry.post.title}</strong></Link>
                                                <small>{entry.post.organization?.name ?? entry.post.owner.displayName} · sent {timeAgo(entry.createdAt)}</small>
                                            </div>
                                            <div className="button-row">
                                                <StatusPill status={entry.status}/>
                                                {entry.status === 'PENDING' && (
                                                    <button className="text-button" onClick={() => act(() => invitationsApi.cancel(entry.id))}>Withdraw</button>
                                                )}
                                            </div>
                                        </>
                                    )}/>
                )}

                {section === 'invitations' && (
                    <>
                        <InvitationList items={data.invitations} empty="No invitations yet. A complete profile helps people find you."
                                        render={(entry) => (
                                            <>
                                                <PersonLine user={entry.inviter} detail="invited you to"/>
                                                <div className="invitation__post">
                                                    <KindBadge kind={entry.post.kind}/>
                                                    <Link to={`/posts/${entry.post.id}`}><strong>{entry.post.title}</strong></Link>
                                                </div>
                                                {entry.message && <blockquote>“{entry.message}”</blockquote>}
                                                {entry.status === 'PENDING' ? (
                                                    <div className="button-row">
                                                        <button className="button button--primary button--small"
                                                                onClick={() => act(() => invitationsApi.respond(entry.id, 'ACCEPT'))}>Accept
                                                        </button>
                                                        <button className="button button--ghost button--small"
                                                                onClick={() => act(() => invitationsApi.respond(entry.id, 'DECLINE'))}>Decline
                                                        </button>
                                                    </div>
                                                ) : <StatusPill status={entry.status}/>}
                                            </>
                                        )}/>
                        {data.invitesSent.length > 0 && (
                            <>
                                <h3 className="small-label">Invitations you sent</h3>
                                <InvitationList items={data.invitesSent} empty="" render={(entry) => (
                                    <>
                                        <PersonLine user={entry.applicant} detail={`for ${entry.post.title}`}/>
                                        <div className="button-row">
                                            <StatusPill status={entry.status}/>
                                            {entry.status === 'PENDING' && (
                                                <button className="text-button" onClick={() => act(() => invitationsApi.cancel(entry.id))}>Withdraw</button>
                                            )}
                                        </div>
                                    </>
                                )}/>
                            </>
                        )}
                    </>
                )}

                {section === 'cards' && (
                    data.myPosts.length === 0
                        ? <EmptyState title="You have no open cards">
                            <Link className="button button--primary" to="/posts/new">Create a card</Link>
                        </EmptyState>
                        : <div className="card-grid card-grid--narrow">
                            {data.myPosts.map((post) => {
                                const waiting = data.requests.filter((entry) => entry.post.id === post.id && entry.status === 'PENDING').length;
                                return <PostCard key={post.id} post={post} footer={
                                    <Link to={`/posts/${post.id}`}>{waiting > 0 ? `${waiting} waiting for review →` : 'Manage →'}</Link>
                                }/>;
                            })}
                        </div>
                )}
            </section>
        </div>
    );
}

function Stat({label, value, onClick}: { label: string; value: number; onClick?: () => void }) {
    const content = <><strong>{value}</strong><span>{label}</span></>;
    return onClick
        ? <button type="button" className="stat" onClick={onClick}>{content}</button>
        : <div className="stat">{content}</div>;
}

function InvitationList({items, empty, emptyAction, render}: {
    items: InvitationView[];
    empty: string;
    emptyAction?: ReactNode;
    render: (entry: InvitationView) => ReactNode;
}) {
    if (items.length === 0) return empty ? <EmptyState title={empty}>{emptyAction}</EmptyState> : null;
    return (
        <ul className="invitation-list">
            {items.map((entry) => <li key={entry.id} className="invitation">{render(entry)}</li>)}
        </ul>
    );
}
