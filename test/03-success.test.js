const {File} = require('@poetry/mongoose').schemas;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {assert, expect} = chai;
const sinon = require('sinon');
const {success} = require('../src/03-success');

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
        lambda: 'success',
        withIdentity: false
    }
};

const event = {
    body: JSON.stringify(rawEvent.body)
};

describe('Success', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.ENV = 'TEST';
        sandbox.stub(File, 'updateOne').callsFake(() => {
            return {
                exec: () => Promise.resolve()
            };
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('process.env.ENV should equal TEST', () => {
        assert.strictEqual(process.env.ENV, 'TEST');
    });
    it('runLambda should be called', async () => {
        sandbox.spy(success.instance, 'runLambda');
        await success.lambda(event);
        assert.isTrue(success.instance.runLambda.calledOnce);
    });
    it('Lambda should be initialized with the correct values referenced on [this]', async () => {
        await success.lambda(event);
        assert.strictEqual(rawEvent.body.hash, success.instance.hash);
        assert.strictEqual(rawEvent.body.fileName, success.instance.fileName);
        assert.strictEqual(rawEvent.body.projectId, success.instance.projectId);
        assert.strictEqual(rawEvent.body.folderId, success.instance.folderId);
        assert.strictEqual(rawEvent.body.organizationId, success.instance.organizationId);
        assert.strictEqual(rawEvent.body.subscriptionKey, success.instance.subscriptionKey);
        assert.strictEqual(rawEvent.body.attempts, success.instance.attempts);
        assert.strictEqual(rawEvent.body.withIdentity, success.instance.withIdentity);
        assert.strictEqual(rawEvent.body.network, success.instance.network);
    });
    it('updateLambda should be called', async () => {
        sandbox.spy(success.instance, 'updateFile');
        await success.lambda(event);
        assert.isTrue(success.instance.updateFile.calledOnce);
    });
    it('File updateOne should be called', async () => {
        await success.lambda(event);
        assert.isTrue(File.updateOne.calledOnce);
    });
});
