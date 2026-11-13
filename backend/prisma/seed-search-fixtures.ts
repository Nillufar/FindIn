import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.invitation.deleteMany();
    await prisma.projectRequiredSkill.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const owner = await prisma.user.create({
        data: {
            email: 'owner@findin.test',
            displayName: 'Slice Tester',
            skills: ['react', 'typescript', 'node'],
        },
    });

    const fixtures = [
        {
            title: 'FindIn Web App',
            description: 'React + TypeScript collaboration platform',
            sourceType: 'OPEN_SOURCE' as const,
            fieldOfStudy: 'Computer Science',
            minWeeklyHours: 5,
            timeline: 'MEDIUM' as const,
            skills: ['react', 'typescript'],
        },
        {
            title: 'Realtime Ops Dashboard',
            description: 'Node backend with React admin',
            sourceType: 'PROPRIETARY' as const,
            fieldOfStudy: 'Computer Science',
            minWeeklyHours: 15,
            timeline: 'LONG' as const,
            skills: ['react', 'node'],
        },
        {
            title: 'ML Study Tracker',
            description: 'Python data science learning tracker',
            sourceType: 'OPEN_SOURCE' as const,
            fieldOfStudy: 'Data Science',
            minWeeklyHours: 8,
            timeline: 'SHORT' as const,
            skills: ['python'],
        },
    ];

    for (const fixture of fixtures) {
        const {skills, ...projectData} = fixture;
        await prisma.project.create({
            data: {
                ...projectData,
                ownerId: owner.id,
                requiredSkills: {
                    create: skills.map((skill) => ({skill})),
                },
            },
        });
    }

    const projects = await prisma.project.findMany({
        include: {requiredSkills: true},
        orderBy: {title: 'asc'},
    });

    console.log(
        JSON.stringify(
            {
                ownerId: owner.id,
                projects: projects.map((project) => ({
                    title: project.title,
                    skills: project.requiredSkills.map((skill) => skill.skill),
                    fieldOfStudy: project.fieldOfStudy,
                    minWeeklyHours: project.minWeeklyHours,
                    sourceType: project.sourceType,
                })),
            },
            null,
            2,
        ),
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
