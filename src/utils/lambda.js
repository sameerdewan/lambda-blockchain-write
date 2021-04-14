'use strict';
const adapters = require('@poetry/adapters');
const {connectDB} = require('@poetry/mongoose');

class Lambda {
    constructor() {
        this.lambdas = [];
        return {
            lambda: async (event) => {
                try {
                    this.initializeLambda(event);
                    this.setUtils();
                    await this.runLambda();
                } catch (error) {
                    if (this.attempts <= 5) {
                        await this.reattempt(event.body);
                    } else {
                        await this.abort(error);
                    }
                }
            },
            instance: this
        }
    }
    initializeLambda({body}) {
        this.body = body;
        this.hash = body.hash;
        this.fileName = body.fileName;
        this.projectId = body.projectId;
        this.folderId = body.folderId;
        this.organizationId = body.organizationId;
        this.subscriptionKey = body.subscriptionKey;
        this.attempts = body.attempts ? body.attempts : 0;
        this.network = body.network;
        this.lambda = body.lambda;
    }
    setUtils() {
        if (process.env.ENV === 'TEST') {
            this.adapter = require('../../test/utils/stubAdapter');
            this.connectDB = require('../../test/utils/stubConnectDB');
            this.sqsMessage = require('../../test/utils/stubSQS');
        } else {
            this.adapter = adapters[this.network];
            this.connectDB = connectDB;
        }
    }
    async runLambda() {
        throw new Error('Lambda does not have a runLambda function set');
    }
    getNextLambda() {

    }
    async fireNextLambda() {
        this.body.attempts = 0;
        await this.sqsMessage(this.body, this.getNextLambda()).send();
    }
}

module.exports = Lambda;
