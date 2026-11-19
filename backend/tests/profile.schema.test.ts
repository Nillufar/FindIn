import assert from 'node:assert/strict';
import test from 'node:test';
import {profileUpdateSchema} from '../src/modules/users/profile.schema.ts';

test('normalizes editable profile fields and duplicate skills', () => {
    const result = profileUpdateSchema.safeParse({
        displayName: '  Ada Lovelace ',
        bio: '  Building useful software. ',
        fieldOfStudy: '',
        skills: [' TypeScript ', 'typescript', 'React'],
        portfolioUrl: 'https://ada.example',
        githubRepositories: ['https://github.com/ada/analytical-engine'],
    });

    assert.equal(result.success, true);
    if (result.success) {
        assert.deepEqual(result.data, {
            displayName: 'Ada Lovelace',
            bio: 'Building useful software.',
            fieldOfStudy: null,
            skills: ['TypeScript', 'React'],
            portfolioUrl: 'https://ada.example',
            githubRepositories: ['https://github.com/ada/analytical-engine'],
        });
    }
});

test('rejects unsafe and non-GitHub links', () => {
    assert.equal(profileUpdateSchema.safeParse({portfolioUrl: 'javascript:alert(1)'}).success, false);
    assert.equal(profileUpdateSchema.safeParse({githubRepositories: ['https://example.com/user/repo']}).success, false);
});

test('rejects empty or unknown profile updates', () => {
    assert.equal(profileUpdateSchema.safeParse({}).success, false);
    assert.equal(profileUpdateSchema.safeParse({email: 'private@example.com'}).success, false);
});
