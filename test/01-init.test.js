'use strict';
const {Project, Folder, Organization, File} = require('@poetry/mongoose').schemas;
const { assert } = require('chai');
const rejects = require('assert').rejects;
const sinon = require('sinon');
const {init} = require('../src/01-init');

const event = {
    body: JSON.stringify({
        hash: '17922b3e429fac38dce5c71a00325daa0733ae5e1c2bd3d1c8e0ef0e3a2e261b',
        fileName: 'file.pdf',
        projectId: '607714a8dd1404e6ada8239a',
        folderId: '607714b3deea8050f3cd30a8',
        organizationId: '607714bc58d62e39be398e44',
        subscriptionKey: 'apikey1234abcdefghij0123456789',
        attempts: 0,
        network: 'ethereum',
        lambda: 'init'
    })
};

exports.event = event;

const rawEvent = {
    body: {
        hash: '17922b3e429fac38dce5c71a00325daa0733ae5e1c2bd3d1c8e0ef0e3a2e261b',
        fileName: 'file.pdf',
        projectId: '607714a8dd1404e6ada8239a',
        folderId: '607714b3deea8050f3cd30a8',
        organizationId: '607714bc58d62e39be398e44',
        subscriptionKey: 'apikey1234abcdefghij0123456789',
        attempts: 0,
        network: 'ethereum',
        lambda: 'init'
    }
};

describe('Init', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.ENV = 'TEST';
        sandbox.stub(Organization, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({subscriptionKey: rawEvent.body.subscriptionKey})
            };
        });
        
        sandbox.stub(Project, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({organizationId: rawEvent.body.organizationId})
            };
        });
        
        sandbox.stub(Folder, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({organizationId: rawEvent.body.organizationId, projectId: rawEvent.body.projectId})
            };
        });
        sandbox.stub(File, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({networks: ['FAKE-NETWORK']})
            };
        });
        sandbox.stub(File, 'updateOne').callsFake(() => {
            return {
                exec: () => Promise.resolve()
            };
        });
        sandbox.stub(init.instance, 'fireNextLambda').callsFake(() => {
            return Promise.resolve()
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('process.env.ENV should equal TEST', () => {
        assert.strictEqual(process.env.ENV, 'TEST');
    });
    it('Lambda should be initialized with the correct values referenced on [this]', async () => {
        await init.lambda(event);
        assert.strictEqual(rawEvent.body.hash, init.instance.hash);
        assert.strictEqual(rawEvent.body.fileName, init.instance.fileName);
        assert.strictEqual(rawEvent.body.projectId, init.instance.projectId);
        assert.strictEqual(rawEvent.body.folderId, init.instance.folderId);
        assert.strictEqual(rawEvent.body.organizationId, init.instance.organizationId);
        assert.strictEqual(rawEvent.body.subscriptionKey, init.instance.subscriptionKey);
        assert.strictEqual(rawEvent.body.attempts, init.instance.attempts);
        assert.strictEqual(rawEvent.body.network, init.instance.network);
    });
    it('Init should fail if organizationId is not found', async () => {
        Organization.findOne.restore();
        sandbox.stub(Organization, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve(undefined)
            };
        });
        await rejects(init.lambda(event), {message: 'Organization not found'});
    });
});
