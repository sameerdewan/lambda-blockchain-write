'use strict';
const { assert } = require('chai');
const {init} = require('../src/01-init');

const event = {
    body: {
        hash: '17922b3e429fac38dce5c71a00325daa0733ae5e1c2bd3d1c8e0ef0e3a2e261b',
        projectId: '607714a8dd1404e6ada8239a',
        folderId: '607714b3deea8050f3cd30a8',
        organizationId: '607714bc58d62e39be398e44',
        subscriptionKey: 'apikey1234abcdefghij0123456789',
        attempts: 0,
        network: 'ethereum'
    }
};

describe('Init', () => {
    before(() => {
        process.env.ENV = 'TEST';
    });
    it('process.env.ENV should equal TEST', () => {
        assert.strictEqual(process.env.ENV, 'TEST');
    });
    it('Lambda should be initialized with the correct values referenced on [this]', async () => {
        await init.lambda(event);
        assert.strictEqual(event.body.hash, init.instance.hash);
        assert.strictEqual(event.body.projectId, init.instance.projectId);
        assert.strictEqual(event.body.folderId, init.instance.folderId);
        assert.strictEqual(event.body.organizationId, init.instance.organizationId);
        assert.strictEqual(event.body.subscriptionKey, init.instance.subscriptionKey);
        assert.strictEqual(event.body.attempts, init.instance.attempts);
        assert.strictEqual(event.body.network, init.instance.network);
    });
});
