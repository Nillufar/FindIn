import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import type {InvitationStatus, MembershipView, PostKind, ProjectCard, UserSummary} from '@findin/shared';
import {KIND_LABELS, STATUS_LABELS, TIMELINE_LABELS, membershipVerb, timeAgo} from '../lib/labels';

const AVATAR_TONES = ['#155f3c', '#b96e47', '#2f6f8f', '#7a4f9a', '#9a6a12', '#a2434f'];

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join('') || '?';
}

export function Avatar({user, size = 40}: { user: Pick<UserSummary, 'id' | 'displayName' | 'avatarUrl'>; size?: number }) {
    const style = {width: size, height: size, fontSize: size * 0.38};
    if (user.avatarUrl) return <img className="avatar" style={style} src={user.avatarUrl} alt=""/>;
    const tone = AVATAR_TONES[[...user.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_TONES.length];
    return <span className="avatar" style={{...style, background: tone}} aria-hidden="true">{initials(user.displayName)}</span>;
}

export function KindBadge({kind}: { kind: PostKind }) {
    return <span className={`kind-badge kind-badge--${kind.toLowerCase()}`}>{KIND_LABELS[kind]}</span>;
}

export function StatusPill({status}: { status: InvitationStatus }) {
    return <span className={`status-pill status-pill--${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>;
}

export function Tags({items, label}: { items: string[]; label: string }) {
    if (items.length === 0) return null;
    return (
        <ul className="tags" aria-label={label}>
            {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
    );
}

export function PersonLine({user, detail}: { user: UserSummary; detail?: ReactNode }) {
    return (
        <Link className="person-line" to={`/people/${user.id}`}>
            <Avatar user={user} size={36}/>
            <span>
                <strong>{user.displayName}</strong>
                <small>{detail ?? [user.major, user.university].filter(Boolean).join(' · ')}</small>
            </span>
        </Link>
    );
}

/** "Works at Bright Labs" / "Member of Robotics Club" chip for profiles and people cards. */
export function MembershipBadge({membership}: { membership: MembershipView }) {
    return (
        <Link className="membership-badge" to={`/organizations/${membership.organization.id}`}>
            <span>{membershipVerb(membership.organization.type, membership.isCurrent)}</span>
            <strong>{membership.organization.name}</strong>
        </Link>
    );
}

export function PostCard({post, footer}: { post: ProjectCard; footer?: ReactNode }) {
    const postedBy = post.organization?.name ?? post.owner.displayName;
    return (
        <article className="post-card">
            <header className="post-card__header">
                <KindBadge kind={post.kind}/>
                <span className="post-card__age">{timeAgo(post.createdAt)}</span>
            </header>
            <h3><Link to={`/posts/${post.id}`}>{post.title}</Link></h3>
            <p className="post-card__by">by {postedBy}{post.location ? ` · ${post.location}` : ''}</p>
            <p className="post-card__description">{post.description}</p>
            <dl className="post-card__meta">
                <div><dt>Field</dt><dd>{post.fieldOfStudy}</dd></div>
                <div><dt>Hours / week</dt><dd>{post.minWeeklyHours}+</dd></div>
                <div><dt>{post.compensation ? 'Pay' : 'Timeline'}</dt>
                    <dd>{post.compensation ?? TIMELINE_LABELS[post.timeline].split(' · ')[0]}</dd></div>
            </dl>
            <Tags items={post.requiredSkills} label="Skills wanted"/>
            {footer && <footer className="post-card__footer">{footer}</footer>}
        </article>
    );
}

export function PersonCard({user}: { user: UserSummary }) {
    return (
        <article className="person-card">
            <Avatar user={user} size={56}/>
            <h3><Link to={`/people/${user.id}`}>{user.displayName}</Link></h3>
            {user.headline && <p className="person-card__headline">{user.headline}</p>}
            <p className="person-card__school">{[user.major, user.university].filter(Boolean).join(' · ') || 'Profile in progress'}</p>
        </article>
    );
}

export function EmptyState({title, children}: { title: string; children?: ReactNode }) {
    return (
        <div className="empty-state">
            <strong>{title}</strong>
            {children && <p>{children}</p>}
        </div>
    );
}

export function PageState({loading, error}: { loading: boolean; error: string | null }) {
    if (loading) return <p className="page-state">Loading…</p>;
    if (error) return <p className="page-state page-state--error" role="alert">{error}</p>;
    return null;
}
