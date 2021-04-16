'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {assert} = chai;
const {rejects} = require('assert');
const sinon = require('sinon');
const {handler} = require('../index');
const init = require('../src/01-init');
const push = require('../src/02-push');
const success = require('../src/03-success');

function generateEvent(lambda) {
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
            lambda,
            withIdentity: false
        }
    };
    const event = {
        body: JSON.stringify(rawEvent.body)
    };
    return event;
}

describe('Root handler', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(init, 'handler').callsFake(() => Promise.resolve());
        sandbox.stub(push, 'handler').callsFake(() => Promise.resolve());
        sandbox.stub(success, 'handler').callsFake(() => Promise.resolve());
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('Root handler directs to init handler on lambda equalling init', async () => {
        const event = generateEvent('init');
        await handler(event);
        assert.isTrue(init.handler.calledOnce);
        assert.isTrue(init.handler.calledWith({body: event.body}));
    });
    it('Root handler directs to push handler on lambda equalling push', async () => {
        const event = generateEvent('push');
        await handler(event);
        assert.isTrue(push.handler.calledOnce);
        assert.isTrue(push.handler.calledWith({body: event.body}));
    });
    it('Root handler directs to success handler on lambda equalling success', async () => {
        const event = generateEvent('success');
        await handler(event);
        assert.isTrue(success.handler.calledOnce);
        assert.isTrue(success.handler.calledWith({body: event.body}));
    });
    it('Root handler throws error if lambda not provided', async () => {
        const event = generateEvent(undefined);
        await rejects(handler(event), {message: 'Lambda not provided'});
        assert.isFalse(init.handler.calledOnce);
        assert.isFalse(push.handler.calledOnce);
        assert.isFalse(success.handler.calledOnce);
    });
});
