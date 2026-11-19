import type {Prisma} from '@prisma/client';
import type {
    InvitationView,
    MembershipView,
    OrganizationSummary,
    ProjectCard,
    UserSummary,
} from '@findin/shared';

/* Prisma selects shared by every module, so each API returns the same shapes. */

export const userSummarySelect = {
    id: true,
    displayName: true,
    avatarUrl: true,
    headline: true,
    university: true,
    major: true,
} satisfies Prisma.UserSelect;

export const organizationSummarySelect = {
    id: true,
    name: true,
    type: true,
} satisfies Prisma.OrganizationSelect;

export const projectCardSelect = {
    id: true,
    kind: true,
    title: true,
    description: true,
    sourceType: true,
    repositoryUrl: true,
    location: true,
    compensation: true,
    fieldOfStudy: true,
    minWeeklyHours: true,
    timeline: true,
    status: true,
    ownerId: true,
    createdAt: true,
    owner: {select: userSummarySelect},
    organization: {select: organizationSummarySelect},
    requiredSkills: {
        select: {skill: true},
        orderBy: {skill: 'asc' as const},
    },
} satisfies Prisma.ProjectSelect;

export const invitationSelect = {
    id: true,
    type: true,
    status: true,
    message: true,
    createdAt: true,
    updatedAt: true,
    project: {select: projectCardSelect},
    applicant: {select: userSummarySelect},
    inviter: {select: userSummarySelect},
} satisfies Prisma.InvitationSelect;

export const membershipSelect = {
    id: true,
    title: true,
    isCurrent: true,
    isAdmin: true,
    sourcePostId: true,
    startedAt: true,
    endedAt: true,
    organization: {select: organizationSummarySelect},
} satisfies Prisma.MembershipSelect;

type UserSummaryRow = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>;
type ProjectCardRow = Prisma.ProjectGetPayload<{ select: typeof projectCardSelect }>;
type InvitationRow = Prisma.InvitationGetPayload<{ select: typeof invitationSelect }>;
type MembershipRow = Prisma.MembershipGetPayload<{ select: typeof membershipSelect }>;

export function toUserSummary(row: UserSummaryRow): UserSummary {
    return {
        id: row.id,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl ?? undefined,
        headline: row.headline ?? undefined,
        university: row.university ?? undefined,
        major: row.major ?? undefined,
    };
}

export function toOrganizationSummary(row: OrganizationSummary): OrganizationSummary {
    return {id: row.id, name: row.name, type: row.type};
}

export function toProjectCard(row: ProjectCardRow): ProjectCard {
    return {
        id: row.id,
        kind: row.kind,
        title: row.title,
        description: row.description,
        sourceType: row.sourceType ?? undefined,
        repositoryUrl: row.repositoryUrl ?? undefined,
        location: row.location ?? undefined,
        compensation: row.compensation ?? undefined,
        organization: row.organization ? toOrganizationSummary(row.organization) : undefined,
        owner: toUserSummary(row.owner),
        fieldOfStudy: row.fieldOfStudy,
        minWeeklyHours: row.minWeeklyHours,
        timeline: row.timeline,
        status: row.status,
        ownerId: row.ownerId,
        requiredSkills: row.requiredSkills.map((entry) => entry.skill),
        createdAt: row.createdAt.toISOString(),
    };
}

export function toInvitationView(row: InvitationRow): InvitationView {
    return {
        id: row.id,
        type: row.type,
        status: row.status,
        message: row.message ?? undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        post: toProjectCard(row.project),
        applicant: toUserSummary(row.applicant),
        inviter: toUserSummary(row.inviter),
    };
}

export function toMembershipView(row: MembershipRow): MembershipView {
    return {
        id: row.id,
        title: row.title,
        isCurrent: row.isCurrent,
        isAdmin: row.isAdmin,
        viaFindIn: row.sourcePostId !== null,
        startedAt: row.startedAt.toISOString(),
        endedAt: row.endedAt?.toISOString(),
        organization: toOrganizationSummary(row.organization),
    };
}

/** Normalize free-form tag lists (skills, interests): trimmed, lowercase, unique, non-empty. */
export function normalizeTags(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

/** Turn optional empty strings from forms into undefined so they are stored as NULL. */
export function emptyToUndefined<T extends Record<string, unknown>>(input: T): T {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === '' ? undefined : value])) as T;
}
