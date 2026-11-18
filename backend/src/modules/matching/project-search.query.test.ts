import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {normalizeSkill, parseProjectSearchQuery} from './project-search.query.js';

describe('parseProjectSearchQuery', () => {
    it('parses comma-separated and repeated tags into normalized unique skills', () => {
        const filters = parseProjectSearchQuery({
            tags: ['React, TypeScript', 'node'],
            maxWeeklyHours: '10',
            sourceType: 'OPEN_SOURCE',
        });

        assert.deepEqual(filters.tags, ['react', 'typescript', 'node']);
        assert.equal(filters.maxWeeklyHours, 10);
        assert.equal(filters.sourceType, 'OPEN_SOURCE');
        assert.equal(filters.limit, 20);
        assert.equal(filters.offset, 0);
    });

    it('rejects invalid source types', () => {
        assert.throws(() => parseProjectSearchQuery({sourceType: 'freelance'}));
    });
});

describe('normalizeSkill', () => {
    it('lowercases and trims skills for indexed equality', () => {
        assert.equal(normalizeSkill('  GraphQL '), 'graphql');
    });
});
