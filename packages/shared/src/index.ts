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
