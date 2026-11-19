import {z} from 'zod';

const httpUrl = z.string().trim().url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
}, 'URL must use HTTP or HTTPS');

const optionalText = (maxLength: number) => z.string()
    .trim()
    .max(maxLength)
    .transform((value) => value || null);

export const profileUpdateSchema = z.object({
    displayName: z.string().trim().min(1).max(80).optional(),
    bio: optionalText(500).optional(),
    fieldOfStudy: optionalText(120).optional(),
    skills: z.array(z.string().trim().min(1).max(50)).max(30).transform((skills) => {
        const unique = new Map<string, string>();
        for (const skill of skills) {
            if (!unique.has(skill.toLowerCase())) unique.set(skill.toLowerCase(), skill);
        }
        return [...unique.values()];
    }).optional(),
    portfolioUrl: z.union([z.literal(''), httpUrl]).transform((value) => value || null).optional(),
    githubRepositories: z.array(httpUrl.refine((value) => {
        const url = new URL(value);
        return url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2;
    }, 'Enter a GitHub repository URL')).max(20).optional(),
}).strict().refine((profile) => Object.keys(profile).length > 0, 'At least one profile field must be provided');

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
