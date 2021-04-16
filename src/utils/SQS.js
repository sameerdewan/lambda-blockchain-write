'use strict';
const aws = require('aws-sdk');

const sqs = new aws.SQS();

class SQS {
    constructor(body, lambda) {
        this.body = body;
        this.lambda = lambda;
        this.sqs = sqs;
    }
    async send() {
        const message = {
            MessageBody: JSON.stringify({
                message: this.body,
                lambda: this.lambda
            }),
            QueueUrl: process.env.SQS_URL,
            DelaySeconds: 0
        };
        await this.sqs.sendMessage(message).promise();
    }
}

module.exports = SQS;
