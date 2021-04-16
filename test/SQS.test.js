'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {assert} = chai;
const sinon = require('sinon');
const SQS = require('../src/utils/SQS');

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

describe('SQS', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('SQS [this] body and lambda should be correct', () => {
        const sqsMessage = new SQS(rawEvent.body, rawEvent.body.lambda);
        assert.strictEqual(sqsMessage.body, rawEvent.body);
        assert.strictEqual(sqsMessage.lambda, rawEvent.body.lambda);
    });
    it('AWS sqs should send the correct message', async () => {
        process.env.SQS_URL = 'fake-queue-string-url'
        const sqsMessage = new SQS(rawEvent.body, rawEvent.body.lambda);
        let sentMsg;
        sqsMessage.sqs = {
            sendMessage: (message) => {
                sentMsg = message;
                return {
                    promise: () => {
                        return Promise.resolve();
                    }
                };
            }
        };
        sandbox.spy(sqsMessage.sqs, 'sendMessage');
        await sqsMessage.send();
        const expectedMsg = {
            DelaySeconds: 0,
            MessageBody: JSON.stringify({
                message: rawEvent.body,
                lambda: rawEvent.body.lambda
            }),
            QueueUrl: 'fake-queue-string-url'
        };
        assert.deepEqual(sentMsg, expectedMsg);
        assert.isTrue(sqsMessage.sqs.sendMessage.calledOnce);
    });
});
