import { z } from 'zod';
import { SOURCE_TYPES, TIMELINE_CLASSES } from '@findin/shared';
function asStringArray(value) {
    if (value === undefined || value === null || value === '') {
        return [];
    }
    if (Array.isArray(value)) {
        return value.flatMap((entry) => String(entry).split(',')).map((entry) => entry.trim()).filter(Boolean);
    }
    return String(value)
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}
const projectSearchQuerySchema = z.object({
    tags: z.preprocess(asStringArray, z.array(z.string().min(1).max(64)).max(12)).default([]),
    fieldOfStudy: z.string().trim().min(1).max(120).optional(),
    maxWeeklyHours: z.coerce.number().int().positive().max(168).optional(),
    sourceType: z.enum(SOURCE_TYPES).optional(),
    timeline: z.enum(TIMELINE_CLASSES).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).max(10_000).default(0),
});
/** Normalize skill tags so indexed equality lookups stay selective (NFR-03). */
export function normalizeSkill(skill) {
    return skill.trim().toLowerCase();
}
export function parseProjectSearchQuery(query) {
    const parsed = projectSearchQuerySchema.parse(query);
    return {
        tags: [...new Set(parsed.tags.map(normalizeSkill))],
        fieldOfStudy: parsed.fieldOfStudy,
        maxWeeklyHours: parsed.maxWeeklyHours,
        sourceType: parsed.sourceType,
        timeline: parsed.timeline,
        limit: parsed.limit,
        offset: parsed.offset,
    };
}
