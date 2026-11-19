import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createSessionValue, readSessionValue} from './session.js';

describe('session cookie', () => {
    const userId = '5f1c2a8e-0000-4000-8000-000000000001';

    it('reads back the user id it signed', () => {
        assert.equal(readSessionValue(createSessionValue(userId)), userId);
    });

    it('rejects a value whose user id was swapped', () => {
        const [, expiresAt, signature] = createSessionValue(userId).split('.');
        assert.equal(readSessionValue(`another-user.${expiresAt}.${signature}`), undefined);
    });

    it('rejects a value whose expiry was extended', () => {
        const [id, expiresAt, signature] = createSessionValue(userId).split('.');
        assert.equal(readSessionValue(`${id}.${Number(expiresAt) + 999_999}.${signature}`), undefined);
    });

    it('rejects expired, malformed and missing values', () => {
        const longAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;
        assert.equal(readSessionValue(createSessionValue(userId, longAgo)), undefined);
        assert.equal(readSessionValue('not-a-session'), undefined);
        assert.equal(readSessionValue(undefined), undefined);
    });
});
