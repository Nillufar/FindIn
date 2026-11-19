export type ApiHealthResponse = {
    status: 'ok';
    service: string;
    timestamp: string;
};

export const SOURCE_TYPES = ['OPEN_SOURCE', 'PRIVATE_SOURCE', 'PROPRIETARY'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const TIMELINE_CLASSES = ['SHORT', 'MEDIUM', 'LONG'] as const;
export type TimelineClass = (typeof TIMELINE_CLASSES)[number];

export const PROJECT_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** PROJECT: find teammates. JOB: hire people. COLLABORATION: partner between schools and organizations. */
export const POST_KINDS = ['PROJECT', 'JOB', 'COLLABORATION'] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const ORGANIZATION_TYPES = ['COMPANY', 'SCHOOL', 'CLUB', 'NONPROFIT', 'OTHER'] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** INVITE: the post owner invited someone. REQUEST: someone asked to join or applied. */
export const INVITATION_TYPES = ['INVITE', 'REQUEST'] as const;
export type InvitationType = (typeof INVITATION_TYPES)[number];

/** Public project-card shape returned by discovery/search (DR-01). */
export type ProjectCard = {
    id: string;
    kind: PostKind;
    title: string;
    description: string;
    sourceType?: SourceType;
    repositoryUrl?: string;
    location?: string;
    compensation?: string;
    organization?: OrganizationSummary;
    owner: UserSummary;
    fieldOfStudy: string;
    minWeeklyHours: number;
    timeline: TimelineClass;
    status: ProjectStatus;
    ownerId: string;
    requiredSkills: string[];
    createdAt: string;
};

/** FR-03 filter criteria for multi-tag project discovery. */
export type ProjectSearchFilters = {
    kind?: PostKind;
    /** Free-text match on title and description. */
    q?: string;
    tags: string[];
    fieldOfStudy?: string;
    maxWeeklyHours?: number;
    sourceType?: SourceType;
    timeline?: TimelineClass;
    limit: number;
    offset: number;
};

export type ProjectSearchResponse = {
    items: ProjectCard[];
    hasMore: boolean;
    /** Server-side query duration for NFR-03 observability. */
    tookMs: number;
    limit: number;
    offset: number;
};

/* ---------- People, organizations and profiles ---------- */

export type UserSummary = {
    id: string;
    displayName: string;
    avatarUrl?: string;
    headline?: string;
    university?: string;
    major?: string;
};

export type OrganizationSummary = {
    id: string;
    name: string;
    type: OrganizationType;
};

/** A role at an organization: drives "Working at ..." / "Member of ..." on profiles. */
export type MembershipView = {
    id: string;
    title: string;
    isCurrent: boolean;
    isAdmin: boolean;
    /** True when the role came from an accepted FindIn job or collaboration. */
    viaFindIn: boolean;
    startedAt: string;
    endedAt?: string;
    organization: OrganizationSummary;
};

export type UserProfile = UserSummary & {
    email?: string;
    bio?: string;
    graduationYear?: number;
    interests: string[];
    skills: string[];
    linkedinUrl?: string;
    githubUrl?: string;
    websiteUrl?: string;
    resumeUrl?: string;
    memberships: MembershipView[];
    posts: ProjectCard[];
    /** Projects the person joined through FindIn (accepted invitations or requests). */
    teams: ProjectCard[];
    /** True once university and major are filled in. */
    isProfileComplete: boolean;
};

export type ProfileUpdate = {
    displayName: string;
    headline?: string;
    bio?: string;
    university?: string;
    major?: string;
    graduationYear?: number;
    interests: string[];
    skills: string[];
    linkedinUrl?: string;
    githubUrl?: string;
    websiteUrl?: string;
    resumeUrl?: string;
};

export type ExperienceInput = {
    organizationName: string;
    organizationType: OrganizationType;
    title: string;
    isCurrent: boolean;
};

export type PeopleSearchFilters = {
    q?: string;
    major?: string;
    university?: string;
    skill?: string;
    limit: number;
    offset: number;
};

export type PeopleSearchResponse = {
    items: UserSummary[];
    hasMore: boolean;
};

export type OrganizationDetail = OrganizationSummary & {
    description?: string;
    websiteUrl?: string;
    location?: string;
    members: Array<{ user: UserSummary; title: string; isAdmin: boolean; isCurrent: boolean }>;
    posts: ProjectCard[];
    announcements: AnnouncementView[];
    viewerIsAdmin: boolean;
};

export type OrganizationInput = {
    name: string;
    type: OrganizationType;
    description?: string;
    websiteUrl?: string;
    location?: string;
};

/* ---------- Posts, applications and invitations ---------- */

export type PostInput = {
    kind: PostKind;
    title: string;
    description: string;
    fieldOfStudy: string;
    minWeeklyHours: number;
    timeline: TimelineClass;
    requiredSkills: string[];
    sourceType?: SourceType;
    repositoryUrl?: string;
    location?: string;
    compensation?: string;
    organizationId?: string;
};

export type InvitationView = {
    id: string;
    type: InvitationType;
    status: InvitationStatus;
    message?: string;
    createdAt: string;
    updatedAt: string;
    post: ProjectCard;
    applicant: UserSummary;
    inviter: UserSummary;
};

export type PostDetail = ProjectCard & {
    team: UserSummary[];
    announcements: AnnouncementView[];
    viewerIsOwner: boolean;
    /** The viewer's own request or invitation for this post, if any. */
    viewerInvitation?: InvitationView;
    /** Requests and invitations, visible only to the owner. */
    invitations: InvitationView[];
};

export type AnnouncementView = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    author: UserSummary;
    post?: { id: string; title: string; kind: PostKind };
    organization?: OrganizationSummary;
};

export type AnnouncementInput = {
    title: string;
    body: string;
    projectId?: string;
    organizationId?: string;
};

export type DashboardResponse = {
    /** Posts I applied to or asked to join. */
    applied: InvitationView[];
    /** People asking to join my posts. */
    requests: InvitationView[];
    /** Posts that invited me. */
    invitations: InvitationView[];
    /** Invitations I sent to other people. */
    invitesSent: InvitationView[];
    myPosts: ProjectCard[];
    announcements: AnnouncementView[];
};
