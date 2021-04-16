const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {assert, expect} = chai;
const sinon = require('sinon');
const {push} = require('../src/02-push');

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
        lambda: 'push',
        withIdentity: false
    }
};

const event = {
    body: JSON.stringify(rawEvent.body)
};

describe('Push', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.ENV = 'TEST';
        sandbox.stub(push.instance, 'fireNextLambda').callsFake(() => {
            return Promise.resolve()
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('process.env.ENV should equal TEST', () => {
        assert.strictEqual(process.env.ENV, 'TEST');
    });
    it('runLambda should be called', async () => {
        sandbox.spy(push.instance, 'runLambda');
        await push.lambda(event);
        assert.isTrue(push.instance.runLambda.calledOnce);
    });
    it('Lambda should be initialized with the correct values referenced on [this]', async () => {
        await push.lambda(event);
        assert.strictEqual(rawEvent.body.hash, push.instance.hash);
        assert.strictEqual(rawEvent.body.fileName, push.instance.fileName);
        assert.strictEqual(rawEvent.body.projectId, push.instance.projectId);
        assert.strictEqual(rawEvent.body.folderId, push.instance.folderId);
        assert.strictEqual(rawEvent.body.organizationId, push.instance.organizationId);
        assert.strictEqual(rawEvent.body.subscriptionKey, push.instance.subscriptionKey);
        assert.strictEqual(rawEvent.body.attempts, push.instance.attempts);
        assert.strictEqual(rawEvent.body.withIdentity, push.instance.withIdentity);
        assert.strictEqual(rawEvent.body.network, push.instance.network);
    });
    it('setIdentity should be called and this.identity should reflect that', async () => {
        sandbox.spy(push.instance, 'setIdentity');
        await push.lambda(event);
        assert.isTrue(push.instance.setIdentity.calledOnce);
        expect(push.instance.identity).to.be.undefined;
    });
    it('if withIdentity is true, setIdentity should be called and this.identity should reflect that', async () => {
        sandbox.spy(push.instance, 'setIdentity');
        const customEvent = {
            body: JSON.stringify({
                ...rawEvent.body,
                withIdentity: true
            })
        };
        await push.lambda(customEvent);
        assert.isTrue(push.instance.setIdentity.calledOnce);
        expect(push.instance.identity).to.equal(rawEvent.body.organizationId);
    });
    it('transactPush should be called and on success the tx on the lambda and body should be set', async () => {
        sandbox.spy(push.instance, 'transactPush');
        await push.lambda(event);
        assert.isTrue(push.instance.transactPush.calledOnce);
        expect(push.instance.tx).to.equal('stub');
        expect(push.instance.body.tx).to.equal('stub');
    });
    it('<lambda:push> getNextLambda should return <lambda:success>', async () => {
        await push.lambda(event);
        assert.isTrue(push.instance.getNextLambda() == 'success');
    });
    it('fireNextLambda should be called', async () => {
        await push.lambda(event);
        assert.isTrue(push.instance.fireNextLambda.calledOnce);
    });
});
