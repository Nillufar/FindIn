import type {
    InvitationStatus,
    OrganizationType,
    PostKind,
    SourceType,
    TimelineClass,
} from '@findin/shared';

export const KIND_LABELS: Record<PostKind, string> = {
    PROJECT: 'Project',
    JOB: 'Job',
    COLLABORATION: 'Collaboration',
};

export const KIND_DESCRIPTIONS: Record<PostKind, string> = {
    PROJECT: 'Find teammates from any major to build, research or create something together.',
    JOB: 'Hire students for a paid role. People you hire show your organization on their profile.',
    COLLABORATION: 'Partner with clubs, schools and organizations on events, research or programs.',
};

export const TIMELINE_LABELS: Record<TimelineClass, string> = {
    SHORT: 'Short · under 1 month',
    MEDIUM: 'Medium · 1–3 months',
    LONG: 'Long · 3+ months',
};

export const SOURCE_LABELS: Record<SourceType, string> = {
    OPEN_SOURCE: 'Open source',
    PRIVATE_SOURCE: 'Private source',
    PROPRIETARY: 'Proprietary',
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
    COMPANY: 'Company',
    SCHOOL: 'School',
    CLUB: 'Club',
    NONPROFIT: 'Nonprofit',
    OTHER: 'Organization',
};

export const STATUS_LABELS: Record<InvitationStatus, string> = {
    PENDING: 'Waiting for reply',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    CANCELLED: 'Withdrawn',
};

/** "Works at" for companies, "Member of" for clubs, schools and nonprofits. */
export function membershipVerb(type: OrganizationType, isCurrent: boolean): string {
    if (type === 'COMPANY') return isCurrent ? 'Works at' : 'Worked at';
    return isCurrent ? 'Member of' : 'Was a member of';
}

export function joinVerb(kind: PostKind): string {
    return kind === 'JOB' ? 'Apply' : 'Request to join';
}

const relative = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});

export function timeAgo(iso: string, now = Date.now()): string {
    const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
    const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60],
    ];
    for (const [unit, size] of steps) {
        if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
    }
    return 'just now';
}

/** Split "a, b, c" into a clean list. */
export function splitList(value: string): string[] {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}
