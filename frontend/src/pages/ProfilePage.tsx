import {useState, type ChangeEvent, type FormEvent} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ORGANIZATION_TYPES, type OrganizationType, type ProfileUpdate, type UserProfile} from '@findin/shared';
import {describeError} from '../api/client';
import {postsApi, usersApi} from '../api/findin';
import {Avatar, EmptyState, MembershipBadge, PageState, PostCard, Tags} from '../components/ui';
import {useCurrentUser, useSession} from '../features/auth/session';
import {useAsync} from '../hooks/useAsync';
import {ORGANIZATION_TYPE_LABELS, splitList} from '../lib/labels';

/** `/profile` shows your own profile; `/people/:userId` shows anyone's. */
export function ProfilePage() {
    const me = useCurrentUser();
    const {userId = me.id} = useParams();
    const isMe = userId === me.id;
    const {data: profile, error, loading, setData} = useAsync(() => usersApi.get(userId), [userId]);

    if (!profile) return <PageState loading={loading} error={error}/>;

    // One badge per organization, even with several current roles there.
    const current = profile.memberships.filter((entry, index, all) =>
        entry.isCurrent && all.findIndex((other) => other.isCurrent && other.organization.id === entry.organization.id) === index);
    const schoolLine = [profile.major, profile.university].filter(Boolean).join(' · ');

    return (
        <div className="profile">
            <section className="profile-hero panel">
                <div className="profile-hero__cover" aria-hidden="true"/>
                <div className="profile-hero__body">
                    <Avatar user={profile} size={104}/>
                    <div className="profile-hero__text">
                        <h1>{profile.displayName}</h1>
                        {profile.headline && <p className="profile-hero__headline">{profile.headline}</p>}
                        <p className="profile-hero__school">
                            {schoolLine || 'School and major not added yet'}
                            {profile.graduationYear && <> · Class of {profile.graduationYear}</>}
                        </p>
                        {current.length > 0 && (
                            <div className="badge-row">
                                {current.map((membership) => <MembershipBadge key={membership.id} membership={membership}/>)}
                            </div>
                        )}
                    </div>
                    <div className="profile-hero__actions">
                        {isMe
                            ? <Link className="button button--primary" to="/profile/edit">Edit profile</Link>
                            : <InviteToMyPost profile={profile}/>}
                    </div>
                </div>
                <ProfileLinks profile={profile}/>
            </section>

            <div className="profile__layout">
                <div className="stack stack--loose">
                    <section className="panel">
                        <h2 className="section-title">About</h2>
                        {profile.bio ? <p className="prose">{profile.bio}</p> : <p className="muted">No bio yet.</p>}
                        {profile.skills.length > 0 && <><h3 className="small-label">Skills</h3><Tags items={profile.skills} label="Skills"/></>}
                        {profile.interests.length > 0 && <><h3 className="small-label">Interests</h3><Tags items={profile.interests} label="Interests"/></>}
                    </section>

                    <section className="panel">
                        <h2 className="section-title">{isMe ? 'My posts' : 'Posts'}</h2>
                        {profile.posts.length === 0 && <EmptyState title="No open posts"/>}
                        <div className="card-grid card-grid--narrow">
                            {profile.posts.map((post) => <PostCard key={post.id} post={post}/>)}
                        </div>
                    </section>
                </div>

                <div className="stack stack--loose">
                    <Experience profile={profile} isMe={isMe} onChange={setData}/>
                    <section className="panel">
                        <h2 className="section-title">Joined through FindIn</h2>
                        {profile.teams.length === 0 && <p className="muted">None yet.</p>}
                        <ul className="link-list">
                            {profile.teams.map((post) => <li key={post.id}><Link to={`/posts/${post.id}`}>{post.title}</Link></li>)}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}

function ProfileLinks({profile}: { profile: UserProfile }) {
    const links = [
        ['LinkedIn', profile.linkedinUrl], ['GitHub', profile.githubUrl], ['Website', profile.websiteUrl], ['Resume', profile.resumeUrl],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]));
    if (links.length === 0 && !profile.email) return null;
    return (
        <div className="profile-hero__links">
            {profile.email && <span>{profile.email}</span>}
            {links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer">{label} ↗</a>)}
        </div>
    );
}

function Experience({profile, isMe, onChange}: { profile: UserProfile; isMe: boolean; onChange: (profile: UserProfile) => void }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({organizationName: '', organizationType: 'COMPANY' as OrganizationType, title: '', isCurrent: true});
    const [error, setError] = useState<string | null>(null);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        try {
            onChange(await usersApi.addExperience(form));
            setAdding(false);
            setForm({organizationName: '', organizationType: 'COMPANY', title: '', isCurrent: true});
        } catch (caught) {
            setError(describeError(caught));
        }
    }

    return (
        <section className="panel">
            <div className="section-head">
                <h2 className="section-title">Experience</h2>
                {isMe && !adding && <button className="text-button" onClick={() => setAdding(true)}>+ Add</button>}
            </div>
            {profile.memberships.length === 0 && !adding && <p className="muted">No experience added yet.</p>}
            <ul className="experience-list">
                {profile.memberships.map((entry) => (
                    <li key={entry.id}>
                        <div>
                            <strong>{entry.title}</strong>
                            <Link to={`/organizations/${entry.organization.id}`}>{entry.organization.name}</Link>
                            <small>
                                {ORGANIZATION_TYPE_LABELS[entry.organization.type]}
                                {' · '}{entry.isCurrent ? 'Current' : 'Past'}
                                {entry.viaFindIn && <span className="via-findin">Joined via FindIn</span>}
                            </small>
                        </div>
                        {isMe && !entry.viaFindIn && (
                            <button className="text-button text-button--danger" aria-label={`Remove ${entry.title}`}
                                    onClick={async () => onChange(await usersApi.removeExperience(entry.id))}>Remove</button>
                        )}
                    </li>
                ))}
            </ul>
            {adding && (
                <form className="form form--compact" onSubmit={submit}>
                    <label className="field"><span>Role / title</span>
                        <input required value={form.title} onChange={(event) => setForm({...form, title: event.target.value})} placeholder="Research Assistant"/>
                    </label>
                    <label className="field"><span>Organization</span>
                        <input required value={form.organizationName}
                               onChange={(event) => setForm({...form, organizationName: event.target.value})} placeholder="Campus Library"/>
                    </label>
                    <label className="field"><span>Type</span>
                        <select value={form.organizationType}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => setForm({...form, organizationType: event.target.value as OrganizationType})}>
                            {ORGANIZATION_TYPES.map((value) => <option key={value} value={value}>{ORGANIZATION_TYPE_LABELS[value]}</option>)}
                        </select>
                    </label>
                    <label className="checkbox">
                        <input type="checkbox" checked={form.isCurrent} onChange={(event) => setForm({...form, isCurrent: event.target.checked})}/>
                        I’m here now
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <div className="button-row">
                        <button className="button button--primary button--small">Save</button>
                        <button type="button" className="button button--ghost button--small" onClick={() => setAdding(false)}>Cancel</button>
                    </div>
                </form>
            )}
        </section>
    );
}

/** On someone else's profile: invite them to one of my open posts. */
function InviteToMyPost({profile}: { profile: UserProfile }) {
    const myPosts = useAsync(() => usersApi.me().then((me) => me.posts), []);
    const [postId, setPostId] = useState('');
    const [notice, setNotice] = useState<string | null>(null);

    if (!myPosts.data || myPosts.data.length === 0) return null;

    async function invite() {
        if (!postId) return;
        try {
            await postsApi.invite(postId, profile.id);
            setNotice('Invitation sent');
        } catch (caught) {
            setNotice(describeError(caught));
        }
    }

    return (
        <div className="invite-to-post">
            <select value={postId} onChange={(event) => setPostId(event.target.value)} aria-label="Choose one of your posts">
                <option value="">Invite to…</option>
                {myPosts.data.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
            </select>
            <button className="button button--primary" disabled={!postId} onClick={invite}>Invite</button>
            {notice && <small role="status">{notice}</small>}
        </div>
    );
}

/** Used for first-time setup (`/welcome`) and later edits (`/profile/edit`). */
export function EditProfilePage({onboarding = false}: { onboarding?: boolean }) {
    const navigate = useNavigate();
    const {refresh} = useSession();
    const {data: profile, error: loadError, loading} = useAsync(() => usersApi.me(), []);

    if (!profile) return <PageState loading={loading} error={loadError}/>;
    return <ProfileForm profile={profile} onboarding={onboarding} onSaved={async () => {
        await refresh();
        navigate(onboarding ? '/explore' : '/profile');
    }}/>;
}

function ProfileForm({profile, onboarding, onSaved}: { profile: UserProfile; onboarding: boolean; onSaved: () => Promise<void> }) {
    const [form, setForm] = useState({
        displayName: profile.displayName,
        headline: profile.headline ?? '',
        university: profile.university ?? '',
        major: profile.major ?? '',
        graduationYear: profile.graduationYear ? String(profile.graduationYear) : '',
        bio: profile.bio ?? '',
        skills: profile.skills.join(', '),
        interests: profile.interests.join(', '),
        linkedinUrl: profile.linkedinUrl ?? '',
        githubUrl: profile.githubUrl ?? '',
        websiteUrl: profile.websiteUrl ?? '',
        resumeUrl: profile.resumeUrl ?? '',
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((current) => ({...current, [field]: event.target.value}));

    async function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        const input: ProfileUpdate = {
            ...form,
            graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
            skills: splitList(form.skills),
            interests: splitList(form.interests),
        };
        try {
            await usersApi.update(input);
            await onSaved();
        } catch (caught) {
            setError(describeError(caught));
            setSaving(false);
        }
    }

    return (
        <div className="form-page">
            <header className="page-hero page-hero--compact">
                <p className="eyebrow">{onboarding ? 'Welcome to FindIn' : 'Edit profile'}</p>
                <h1>{onboarding ? 'Tell people who you are.' : 'Your profile'}</h1>
                {onboarding && <p className="page-hero__intro">Your school and major help the right teammates, employers and clubs find you. You can change this any time.</p>}
            </header>
            <form className="panel form" onSubmit={submit}>
                <div className="form-row">
                    <label className="field field--grow"><span>Name</span>
                        <input required value={form.displayName} onChange={update('displayName')}/></label>
                    <label className="field field--grow"><span>Headline <em>(optional)</em></span>
                        <input value={form.headline} onChange={update('headline')} placeholder="Nursing student · community health"/></label>
                </div>
                <div className="form-row">
                    <label className="field field--grow"><span>University</span>
                        <input required value={form.university} onChange={update('university')} placeholder="CSUSB"/></label>
                    <label className="field field--grow"><span>Major</span>
                        <input required value={form.major} onChange={update('major')} placeholder="Psychology"/></label>
                    <label className="field field--small"><span>Grad year</span>
                        <input type="number" min={1950} max={2100} value={form.graduationYear} onChange={update('graduationYear')} placeholder="2027"/></label>
                </div>
                <label className="field"><span>Bio <em>(optional)</em></span>
                    <textarea rows={4} value={form.bio} onChange={update('bio')} placeholder="What do you care about and what do you want to work on?"/></label>
                <label className="field"><span>Skills <em>(comma separated)</em></span>
                    <input value={form.skills} onChange={update('skills')} placeholder="public speaking, excel, figma"/></label>
                <label className="field"><span>Interests <em>(comma separated)</em></span>
                    <input value={form.interests} onChange={update('interests')} placeholder="climate, startups, mental health"/></label>
                <details className="fieldset" open={!onboarding}>
                    <summary>Links (optional)</summary>
                    <div className="form-row">
                        <label className="field field--grow"><span>LinkedIn</span>
                            <input type="url" value={form.linkedinUrl} onChange={update('linkedinUrl')} placeholder="https://"/></label>
                        <label className="field field--grow"><span>GitHub</span>
                            <input type="url" value={form.githubUrl} onChange={update('githubUrl')} placeholder="https://"/></label>
                    </div>
                    <div className="form-row">
                        <label className="field field--grow"><span>Website / portfolio</span>
                            <input type="url" value={form.websiteUrl} onChange={update('websiteUrl')} placeholder="https://"/></label>
                        <label className="field field--grow"><span>Resume link</span>
                            <input type="url" value={form.resumeUrl} onChange={update('resumeUrl')} placeholder="https://drive.google.com/…"/></label>
                    </div>
                </details>
                {!onboarding && <p className="muted">Add jobs, clubs and schools under <strong>Experience</strong> on your profile page.</p>}
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="button-row">
                    <button className="button button--primary" disabled={saving}>{saving ? 'Saving…' : onboarding ? 'Continue' : 'Save profile'}</button>
                    {!onboarding && <Link className="button button--ghost" to="/profile">Cancel</Link>}
                </div>
            </form>
        </div>
    );
}
