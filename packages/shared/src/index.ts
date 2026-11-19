export type ApiHealthResponse = {
    status: 'ok';
    service: string;
    timestamp: string;
};

export type ProjectCard = {
    id: string;
    title: string;
    description: string;
    tags: string[];
    repositoryUrl?: string;
};

export type DeveloperProfile = {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    fieldOfStudy: string | null;
    skills: string[];
    portfolioUrl: string | null;
    githubRepositories: string[];
    updatedAt: string;
};

export type UpdateDeveloperProfileInput = Partial<Pick<
    DeveloperProfile,
    'displayName' | 'bio' | 'fieldOfStudy' | 'skills' | 'portfolioUrl' | 'githubRepositories'
>>;
