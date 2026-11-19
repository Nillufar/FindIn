/**
 * Demo data for local development: students from many majors, companies, a club,
 * projects / jobs / collaborations, requests, invitations and announcements.
 *
 * WARNING: deletes all existing FindIn data first. Run with `npm run db:seed:demo`.
 * Then use "Continue as demo student" on the login page (signs in as maya@findin.test).
 */
// Loads DATABASE_URL from the repository-root .env, like the API does.
import '../src/config/env.js';
import {PrismaClient, type OrganizationType, type PostKind, type TimelineClass} from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
    await prisma.announcement.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.projectRequiredSkill.deleteMany();
    await prisma.project.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
}

const people = {
    maya: {
        email: 'maya@findin.test', displayName: 'Maya Chen', headline: 'Psychology student · UX research',
        university: 'CSUSB', major: 'Psychology', graduationYear: 2027,
        bio: 'I study how people make decisions and love turning research into products people actually use.',
        interests: ['mental health', 'ux research', 'community'], skills: ['survey design', 'spss', 'interviewing', 'writing'],
        linkedinUrl: 'https://www.linkedin.com/in/example-maya',
    },
    daniel: {
        email: 'daniel@findin.test', displayName: 'Daniel Ortiz', headline: 'CS student building campus tools',
        university: 'CSUSB', major: 'Computer Science', graduationYear: 2026,
        interests: ['mobile apps', 'health tech'], skills: ['react', 'typescript', 'node'],
        githubUrl: 'https://github.com/example-daniel',
    },
    priya: {
        email: 'priya@findin.test', displayName: 'Priya Nair', headline: 'Co-founder, Bright Labs',
        university: 'UC Riverside', major: 'Marketing', graduationYear: 2025,
        interests: ['startups', 'branding'], skills: ['marketing', 'social media', 'canva'],
    },
    jordan: {
        email: 'jordan@findin.test', displayName: 'Jordan Lee', headline: 'Biology researcher',
        university: 'Cal Poly Pomona', major: 'Biology', graduationYear: 2027,
        interests: ['ecology', 'conservation'], skills: ['field research', 'r', 'lab work'],
    },
    sofia: {
        email: 'sofia@findin.test', displayName: 'Sofia Martinez', headline: 'Graphic designer & illustrator',
        university: 'CSUSB', major: 'Graphic Design', graduationYear: 2026,
        interests: ['illustration', 'branding'], skills: ['figma', 'illustrator', 'branding'],
    },
    ethan: {
        email: 'ethan@findin.test', displayName: 'Ethan Brooks', headline: 'Robotics club lead',
        university: 'UC Riverside', major: 'Mechanical Engineering', graduationYear: 2026,
        interests: ['robotics', 'outreach'], skills: ['cad', 'solidworks', 'arduino'],
    },
    amara: {
        email: 'amara@findin.test', displayName: 'Amara Okafor', headline: 'Nursing student · community health',
        university: 'CSUSB', major: 'Nursing', graduationYear: 2027,
        interests: ['public health', 'volunteering'], skills: ['patient care', 'health education'],
    },
    leo: {
        email: 'leo@findin.test', displayName: 'Leo Kim', headline: 'Accounting & finance',
        university: 'Cal Poly Pomona', major: 'Accounting', graduationYear: 2026,
        interests: ['small business', 'finance'], skills: ['excel', 'quickbooks', 'bookkeeping'],
    },
};

type PostSeed = {
    kind: PostKind;
    title: string;
    description: string;
    fieldOfStudy: string;
    minWeeklyHours: number;
    timeline: TimelineClass;
    skills: string[];
    location?: string;
    compensation?: string;
    daysAgo: number;
};

async function main() {
    await reset();

    const users = Object.fromEntries(
        await Promise.all(Object.entries(people).map(async ([key, data]) => [key, await prisma.user.create({data})] as const)),
    ) as Record<keyof typeof people, { id: string }>;

    async function org(name: string, type: OrganizationType, adminId: string, extra: {
        description?: string;
        location?: string;
        websiteUrl?: string
    } = {}) {
        const organization = await prisma.organization.create({data: {name, type, createdById: adminId, ...extra}});
        await prisma.membership.create({
            data: {userId: adminId, organizationId: organization.id, title: 'Admin', isAdmin: true},
        });
        return organization;
    }

    const brightLabs = await org('Bright Labs', 'COMPANY', users.priya.id, {
        description: 'A student-run marketing studio helping local businesses grow online.',
        location: 'Riverside, CA',
    });
    const bakery = await org('Inland Bakery Co.', 'COMPANY', users.leo.id, {
        description: 'Family bakery with three locations in the Inland Empire.',
        location: 'San Bernardino, CA',
    });
    const psychSociety = await org('CSUSB Psychology Society', 'CLUB', users.maya.id, {
        description: 'Talks, research nights and mental-health outreach for CSUSB students.',
    });
    const robotics = await org('UCR Robotics Club', 'CLUB', users.ethan.id, {
        description: 'Build nights, competitions and K-12 outreach.',
    });
    // Maya's role is Admin; give her a friendlier title on her profile.
    await prisma.membership.updateMany({
        where: {userId: users.maya.id, organizationId: psychSociety.id},
        data: {title: 'President'},
    });

    async function post(ownerId: string, seed: PostSeed, organizationId?: string) {
        return prisma.project.create({
            data: {
                kind: seed.kind,
                title: seed.title,
                description: seed.description,
                fieldOfStudy: seed.fieldOfStudy,
                minWeeklyHours: seed.minWeeklyHours,
                timeline: seed.timeline,
                location: seed.location,
                compensation: seed.compensation,
                organizationId,
                ownerId,
                createdAt: new Date(Date.now() - seed.daysAgo * 86_400_000),
                requiredSkills: {create: seed.skills.map((skill) => ({skill}))},
            },
        });
    }

    const mentalHealthApp = await post(users.daniel.id, {
        kind: 'PROJECT', title: 'Campus Mental Health Check-in App',
        description: 'A simple mobile app for daily mood check-ins with links to campus counseling. Looking for psychology, design and CS students.',
        fieldOfStudy: 'Psychology', minWeeklyHours: 5, timeline: 'MEDIUM', skills: ['react', 'ux research', 'survey design'], daysAgo: 12,
    });
    const socialMediaJob = await post(users.priya.id, {
        kind: 'JOB', title: 'Social Media Assistant',
        description: 'Plan and post content for three small-business clients. Flexible hours, remote friendly.',
        fieldOfStudy: 'Marketing', minWeeklyHours: 8, timeline: 'LONG', skills: ['social media', 'writing'],
        location: 'Remote', compensation: '$18/hr', daysAgo: 40,
    }, brightLabs.id);
    const uxJob = await post(users.priya.id, {
        kind: 'JOB', title: 'UX Research Assistant (Part-time)',
        description: 'Run user interviews and usability tests for client websites, then summarize what you learn.',
        fieldOfStudy: 'Psychology', minWeeklyHours: 10, timeline: 'MEDIUM', skills: ['interviewing', 'ux research'],
        location: 'Riverside, CA · Hybrid', compensation: '$20/hr', daysAgo: 3,
    }, brightLabs.id);
    await post(users.leo.id, {
        kind: 'JOB', title: 'Bookkeeping Assistant',
        description: 'Help reconcile weekly sales and keep our books tidy. Great for accounting students.',
        fieldOfStudy: 'Accounting', minWeeklyHours: 6, timeline: 'LONG', skills: ['excel', 'quickbooks'],
        location: 'San Bernardino, CA', compensation: '$19/hr', daysAgo: 5,
    }, bakery.id);
    const plantStudy = await post(users.jordan.id, {
        kind: 'PROJECT', title: 'Native Plant Restoration Study',
        description: 'Weekend field surveys measuring how native plants recover after wildfire. Need help with data collection and a short report.',
        fieldOfStudy: 'Biology', minWeeklyHours: 4, timeline: 'SHORT', skills: ['field research', 'writing'], daysAgo: 2,
    });
    await post(users.amara.id, {
        kind: 'PROJECT', title: 'Community Health Fair',
        description: 'Organizing a free blood-pressure and nutrition fair. Looking for nursing, nutrition and communication students.',
        fieldOfStudy: 'Nursing', minWeeklyHours: 3, timeline: 'SHORT', skills: ['health education', 'event planning'], daysAgo: 6,
    });
    await post(users.sofia.id, {
        kind: 'PROJECT', title: 'Student Zine: Voices of the Inland Empire',
        description: 'A printed zine of student stories and art. Need writers, photographers and illustrators.',
        fieldOfStudy: 'Graphic Design', minWeeklyHours: 3, timeline: 'MEDIUM', skills: ['illustrator', 'writing', 'photography'], daysAgo: 9,
    });
    await post(users.ethan.id, {
        kind: 'COLLABORATION', title: 'Inter-school Robotics Showcase',
        description: 'Partnering with clubs at other schools for a spring showcase. Looking for engineering clubs, art departments to design booths, and business clubs for sponsors.',
        fieldOfStudy: 'Engineering', minWeeklyHours: 2, timeline: 'MEDIUM', skills: ['event planning', 'cad'], location: 'Riverside, CA', daysAgo: 4,
    }, robotics.id);
    const awarenessWeek = await post(users.maya.id, {
        kind: 'COLLABORATION', title: 'Mental Health Awareness Week (cross-campus)',
        description: 'Co-hosting workshops and a resource fair with clubs from nearby campuses. We provide speakers; partners bring volunteers and venues.',
        fieldOfStudy: 'Psychology', minWeeklyHours: 2, timeline: 'SHORT', skills: ['event planning', 'outreach'], daysAgo: 8,
    }, psychSociety.id);
    const stressSurvey = await post(users.maya.id, {
        kind: 'PROJECT', title: 'Student Stress Survey',
        description: 'Designing and running a survey on exam stress across majors. Need help with design, analysis and a visual summary.',
        fieldOfStudy: 'Psychology', minWeeklyHours: 3, timeline: 'SHORT', skills: ['survey design', 'spss', 'data visualization'], daysAgo: 10,
    });

    const invite = (projectId: string, applicantId: string, inviterId: string, type: 'INVITE' | 'REQUEST',
                    status: 'PENDING' | 'ACCEPTED' | 'DECLINED', message?: string) =>
        prisma.invitation.create({data: {projectId, applicantId, inviterId, type, status, message}});

    // Maya was hired through FindIn → shows "Working at Bright Labs" on her profile.
    await invite(socialMediaJob.id, users.maya.id, users.maya.id, 'REQUEST', 'ACCEPTED', 'I run my club\'s Instagram and would love to help.');
    await prisma.membership.create({
        data: {userId: users.maya.id, organizationId: brightLabs.id, title: 'Social Media Assistant', sourcePostId: socialMediaJob.id},
    });
    // Past experience she added herself.
    const cafe = await prisma.organization.create({data: {name: 'Campus Café', type: 'COMPANY', createdById: users.maya.id}});
    await prisma.membership.create({
        data: {
            userId: users.maya.id, organizationId: cafe.id, title: 'Barista', isCurrent: false,
            startedAt: new Date('2024-09-01'), endedAt: new Date('2025-06-01'),
        },
    });

    await invite(mentalHealthApp.id, users.maya.id, users.maya.id, 'REQUEST', 'ACCEPTED', 'I can run the user interviews.');
    await invite(uxJob.id, users.maya.id, users.maya.id, 'REQUEST', 'PENDING', 'I have run 20+ interviews for my research methods class.');
    await invite(plantStudy.id, users.maya.id, users.jordan.id, 'INVITE', 'PENDING', 'We need someone to design the volunteer survey. Interested?');
    await invite(stressSurvey.id, users.sofia.id, users.sofia.id, 'REQUEST', 'PENDING', 'I can design the visual summary and charts.');
    await invite(stressSurvey.id, users.leo.id, users.leo.id, 'REQUEST', 'PENDING', 'Happy to help with the stats.');
    await invite(awarenessWeek.id, users.ethan.id, users.ethan.id, 'REQUEST', 'PENDING', 'UCR Robotics Club can host a booth and bring 6 volunteers.');
    await invite(awarenessWeek.id, users.amara.id, users.maya.id, 'INVITE', 'PENDING', 'Would the nursing students run a wellness station?');

    await prisma.announcement.create({
        data: {
            authorId: users.daniel.id, projectId: mentalHealthApp.id, title: 'Sprint 2 kickoff on Thursday',
            body: 'We meet Thursday at 5pm in the library, room 210. Bring your interview notes!',
            createdAt: new Date(Date.now() - 3_600_000 * 5),
        },
    });
    await prisma.announcement.create({
        data: {
            authorId: users.priya.id, organizationId: brightLabs.id, title: 'New client: Inland Bakery Co.',
            body: 'We are starting a 6-week campaign for Inland Bakery. Content calendar is in the shared drive.',
            createdAt: new Date(Date.now() - 86_400_000),
        },
    });
    await prisma.announcement.create({
        data: {
            authorId: users.maya.id, organizationId: psychSociety.id, title: 'Club meeting moved to Wednesday',
            body: 'This week\'s meeting is Wednesday 6pm instead of Tuesday. Pizza provided.',
            createdAt: new Date(Date.now() - 86_400_000 * 2),
        },
    });

    console.log('Demo data ready. Sign in locally with "Continue as demo student" (maya@findin.test).');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
