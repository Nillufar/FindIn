import type {
    DashboardResponse,
    ExperienceInput,
    InvitationView,
    OrganizationDetail,
    OrganizationInput,
    OrganizationSummary,
    PeopleSearchFilters,
    PeopleSearchResponse,
    PostDetail,
    PostInput,
    ProfileUpdate,
    ProjectCard,
    UserProfile,
} from '@findin/shared';
import {api} from './client';

export type SessionUser = {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    university: string | null;
    major: string | null;
    isProfileComplete: boolean;
};

export const authApi = {
    me: () => api<SessionUser>('/auth/me'),
    logout: () => api<void>('/auth/logout', {method: 'POST'}),
    devLogin: (email?: string) => api<void>('/auth/dev-login', {method: 'POST', body: {email}}),
};

export const usersApi = {
    me: () => api<UserProfile>('/users/me'),
    get: (userId: string) => api<UserProfile>(`/users/${userId}`),
    update: (input: ProfileUpdate) => api<UserProfile>('/users/me', {method: 'PUT', body: input}),
    addExperience: (input: ExperienceInput) => api<UserProfile>('/users/me/experience', {method: 'POST', body: input}),
    removeExperience: (membershipId: string) => api<UserProfile>(`/users/me/experience/${membershipId}`, {method: 'DELETE'}),
    search: (filters: PeopleSearchFilters, signal?: AbortSignal) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== '') params.set(key, String(value));
        }
        return api<PeopleSearchResponse>(`/users/search?${params}`, {signal});
    },
};

export const postsApi = {
    get: (postId: string) => api<PostDetail>(`/projects/${postId}`),
    create: (input: PostInput) => api<ProjectCard>('/projects', {method: 'POST', body: input}),
    requestToJoin: (postId: string, message?: string) =>
        api<InvitationView>(`/projects/${postId}/requests`, {method: 'POST', body: {message}}),
    invite: (postId: string, userId: string, message?: string) =>
        api<InvitationView>(`/projects/${postId}/invitations`, {method: 'POST', body: {userId, message}}),
    close: (postId: string) => api<void>(`/projects/${postId}/close`, {method: 'POST'}),
};

export const invitationsApi = {
    respond: (invitationId: string, decision: 'ACCEPT' | 'DECLINE') =>
        api<InvitationView>(`/invitations/${invitationId}/respond`, {method: 'POST', body: {decision}}),
    cancel: (invitationId: string) => api<InvitationView>(`/invitations/${invitationId}/cancel`, {method: 'POST'}),
};

export const organizationsApi = {
    mine: () => api<OrganizationSummary[]>('/organizations/mine'),
    get: (organizationId: string) => api<OrganizationDetail>(`/organizations/${organizationId}`),
    create: (input: OrganizationInput) => api<OrganizationSummary>('/organizations', {method: 'POST', body: input}),
};


export const dashboardApi = {
    get: () => api<DashboardResponse>('/dashboard'),
};
