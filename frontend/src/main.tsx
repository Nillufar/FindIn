import {StrictMode, useCallback, useEffect, useReducer, useState, type FormEvent} from 'react';
import {createRoot} from 'react-dom/client';
import type {DeveloperProfile, UpdateDeveloperProfileInput} from '@findin/shared';
import './styles.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

type ProfileDraft = {
    displayName: string;
    bio: string;
    fieldOfStudy: string;
    skills: string;
    portfolioUrl: string;
    githubRepositories: string;
};

type ProfileState = {
    profile: DeveloperProfile | null;
    draft: ProfileDraft;
    loading: boolean;
    saving: boolean;
    editing: boolean;
    error: string | null;
};

type ProfileAction =
    | {type: 'load-start'}
    | {type: 'load-success'; profile: DeveloperProfile}
    | {type: 'load-failure'; error: string}
    | {type: 'edit-start'}
    | {type: 'edit-cancel'}
    | {type: 'draft-change'; field: keyof ProfileDraft; value: string}
    | {type: 'save-start'}
    | {type: 'save-success'; profile: DeveloperProfile}
    | {type: 'save-failure'; error: string};

const emptyDraft: ProfileDraft = {
    displayName: '',
    bio: '',
    fieldOfStudy: '',
    skills: '',
    portfolioUrl: '',
    githubRepositories: '',
};

const initialState: ProfileState = {
    profile: null,
    draft: emptyDraft,
    loading: false,
    saving: false,
    editing: false,
    error: null,
};

function toDraft(profile: DeveloperProfile): ProfileDraft {
    return {
        displayName: profile.displayName,
        bio: profile.bio ?? '',
        fieldOfStudy: profile.fieldOfStudy ?? '',
        skills: profile.skills.join(', '),
        portfolioUrl: profile.portfolioUrl ?? '',
        githubRepositories: profile.githubRepositories.join('\n'),
    };
}

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
    switch (action.type) {
        case 'load-start':
            return {...initialState, loading: true};
        case 'load-success':
            return {...state, profile: action.profile, draft: toDraft(action.profile), loading: false, error: null};
        case 'load-failure':
            return {...state, profile: null, loading: false, error: action.error};
        case 'edit-start':
            return state.profile ? {...state, editing: true, error: null} : state;
        case 'edit-cancel':
            return state.profile
                ? {...state, draft: toDraft(state.profile), editing: false, error: null}
                : state;
        case 'draft-change':
            return {...state, draft: {...state.draft, [action.field]: action.value}};
        case 'save-start':
            return {...state, saving: true, error: null};
        case 'save-success':
            return {
                ...state,
                profile: action.profile,
                draft: toDraft(action.profile),
                saving: false,
                editing: false,
                error: null,
            };
        case 'save-failure':
            return {...state, saving: false, error: action.error};
    }
}

async function readProfileResponse(response: Response): Promise<DeveloperProfile> {
    const body = await response.json() as DeveloperProfile & {error?: string};
    if (!response.ok) {
        throw new Error(body.error ?? 'The profile request failed.');
    }
    return body;
}

function safeExternalUrl(value: string): string | null {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch {
        return null;
    }
}

function App() {
    const [state, dispatch] = useReducer(profileReducer, initialState);

    const loadProfile = useCallback(async () => {
        dispatch({type: 'load-start'});
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {credentials: 'include'});
            const profile = await readProfileResponse(response);
            dispatch({type: 'load-success', profile});
        } catch (error) {
            dispatch({
                type: 'load-failure',
                error: error instanceof Error ? error.message : 'Unable to load this profile.',
            });
        }
    }, [dispatch]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!state.profile) return;

        const update: UpdateDeveloperProfileInput = {
            displayName: state.draft.displayName,
            bio: state.draft.bio,
            fieldOfStudy: state.draft.fieldOfStudy,
            skills: state.draft.skills.split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean),
            portfolioUrl: state.draft.portfolioUrl.trim(),
            githubRepositories: state.draft.githubRepositories.split('\n').map((url) => url.trim()).filter(Boolean),
        };

        dispatch({type: 'save-start'});
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/users/me/profile`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(update),
                },
            );
            const profile = await readProfileResponse(response);
            dispatch({type: 'save-success', profile});
        } catch (error) {
            dispatch({
                type: 'save-failure',
                error: error instanceof Error ? error.message : 'Unable to save profile changes.',
            });
        }
    }

    const {profile, draft} = state;
    const portfolioUrl = profile?.portfolioUrl ? safeExternalUrl(profile.portfolioUrl) : null;

    return (
        <main className="page-shell">
            <header className="topbar">
                <a className="brand" href="/" aria-label="FindIn home">
                    <span className="brand-mark">F</span>
                    <span>findin</span>
                </a>
                <span className="topbar-label">Developer profiles</span>
            </header>

            <section className="profile-layout" aria-labelledby="page-title">
                <div className="page-heading">
                    <p className="eyebrow">Your work, in one place</p>
                    <h1 id="page-title">Developer profile</h1>
                    <p className="page-intro">
                        Share your skills, areas of study, and the work you have built.
                    </p>
                </div>

                {!profile && (
                    <div className="open-profile-card">
                        <p className="profile-kicker">My profile</p>
                        <p className={state.error ? 'form-error' : 'muted-text'} role={state.error ? 'alert' : undefined}>
                            {state.loading
                                ? 'Loading your profile…'
                                : state.error ?? 'Sign in to your FindIn account to view and edit your profile.'}
                        </p>
                    </div>
                )}

                {profile && (
                    <article className="profile-card">
                        <div className="profile-banner">
                            <div className="avatar" aria-hidden="true">
                                {profile.displayName.trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="profile-heading">
                                <span className="profile-kicker">Developer</span>
                                <h2>{profile.displayName}</h2>
                                <p>@{profile.username}{profile.fieldOfStudy ? ` · ${profile.fieldOfStudy}` : ''}</p>
                            </div>
                            {!state.editing && (
                                <button className="secondary-button edit-button" onClick={() => dispatch({type: 'edit-start'})}>
                                    Edit profile
                                </button>
                            )}
                        </div>

                        {state.editing ? (
                            <form className="profile-editor" onSubmit={saveProfile}>
                                <div className="form-grid">
                                    <label className="field">
                                        <span>Display name</span>
                                        <input
                                            required
                                            maxLength={80}
                                            value={draft.displayName}
                                            onChange={(event) => dispatch({
                                                type: 'draft-change',
                                                field: 'displayName',
                                                value: event.target.value,
                                            })}
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Field of study</span>
                                        <input
                                            maxLength={120}
                                            value={draft.fieldOfStudy}
                                            onChange={(event) => dispatch({
                                                type: 'draft-change',
                                                field: 'fieldOfStudy',
                                                value: event.target.value,
                                            })}
                                            placeholder="e.g. Computer science"
                                        />
                                    </label>
                                    <label className="field field-wide">
                                        <span>About</span>
                                        <textarea
                                            maxLength={500}
                                            rows={4}
                                            value={draft.bio}
                                            onChange={(event) => dispatch({
                                                type: 'draft-change',
                                                field: 'bio',
                                                value: event.target.value,
                                            })}
                                            placeholder="What are you building or hoping to learn?"
                                        />
                                    </label>
                                    <label className="field field-wide">
                                        <span>Programming languages and technologies</span>
                                        <input
                                            value={draft.skills}
                                            onChange={(event) => dispatch({
                                                type: 'draft-change',
                                                field: 'skills',
                                                value: event.target.value,
                                            })}
                                            placeholder="TypeScript, React, PostgreSQL"
                                        />
                                        <small>Separate skills with commas.</small>
                                    </label>
                                    <label className="field field-wide">
                                        <span>Portfolio URL</span>
                                        <input
                                            type="url"
                                            value={draft.portfolioUrl}
                                            onChange={(event) => dispatch({
                                                type: 'draft-change',
                                                field: 'portfolioUrl',
                                                value: event.target.value,
                                            })}
                                            placeholder="https://your-site.dev"
                                        />
                                    </label>
                                    <label className="field field-wide">
                                        <span>GitHub repository URLs</span>
                                        <textarea
                                            rows={3}
                                            value={draft.githubRepositories}
                                            onChange={(event) => dispatch({
                                                type: 'draft-change',
                                                field: 'githubRepositories',
                                                value: event.target.value,
                                            })}
                                            placeholder={'https://github.com/you/project\nOne URL per line'}
                                        />
                                        <small>Add up to 20 public GitHub repository links, one per line.</small>
                                    </label>
                                </div>
                                {state.error && <p className="form-error" role="alert">{state.error}</p>}
                                <div className="form-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => dispatch({type: 'edit-cancel'})}
                                        disabled={state.saving}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={state.saving}>
                                        {state.saving ? 'Saving…' : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-content">
                                {state.error && <p className="form-error" role="alert">{state.error}</p>}
                                <section className="content-section">
                                    <h3>About</h3>
                                    <p className={profile.bio ? 'bio-text' : 'muted-text'}>
                                        {profile.bio || 'Add a short introduction to your profile.'}
                                    </p>
                                </section>
                                <section className="content-section">
                                    <h3>Skills & technologies</h3>
                                    {profile.skills.length > 0 ? (
                                        <ul className="skill-list">
                                            {profile.skills.map((skill) => <li key={skill}>{skill}</li>)}
                                        </ul>
                                    ) : <p className="muted-text">Add the technologies you work with.</p>}
                                </section>
                                <section className="content-section">
                                    <h3>External links</h3>
                                    <div className="link-list">
                                        {portfolioUrl && (
                                            <a href={portfolioUrl} target="_blank" rel="noreferrer">
                                                <span className="link-icon" aria-hidden="true">↗</span>
                                                <span><small>Portfolio</small>{new URL(portfolioUrl).hostname}</span>
                                            </a>
                                        )}
                                        {profile.githubRepositories.map((repository) => {
                                            const url = safeExternalUrl(repository);
                                            if (!url || new URL(url).hostname !== 'github.com') return null;
                                            return (
                                                <a href={url} target="_blank" rel="noreferrer" key={repository}>
                                                    <span className="link-icon github-icon" aria-hidden="true">GH</span>
                                                    <span>
                                                        <small>GitHub repository</small>
                                                        {new URL(url).pathname.replace(/^\/|\/$/g, '')}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                        {!portfolioUrl && profile.githubRepositories.length === 0 && (
                                            <p className="muted-text">Add a portfolio or GitHub repository link.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </article>
                )}
            </section>
        </main>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App/>
    </StrictMode>,
);
