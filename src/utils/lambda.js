'use strict';
const adapters = require('@poetry/adapters');
const {connectDB} = require('@poetry/mongoose');

class Lambda {
    constructor() {
        this.lambdas = ['init', 'push', 'success', 'error'];
        return {
            lambda: async (event) => {
                try {
                    this.initializeLambda(event);
                    this.setUtils();
                    await this.runLambda();
                } catch (error) {
                    console.log(error)
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
            const StubAdapter = require('../../test/utils/stubAdapter');
            this.adapter = new StubAdapter();
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
        const index = this.lambdas.findIndex(x => x === this.lambda);
        const nextLambda = this.lambdas[index + 1];
        if (typeof nextLambda === 'undefined' || nextLambda === null ) {
            throw new Error(`There is no lambda following: ${this.lambda}`);
        }
        return nextLambda;
    }
    async fireNextLambda() {
        this.body.attempts = 0;
        await new this.sqsMessage(this.body, this.getNextLambda()).send();
    }
    async reattempt() {
        this.body.attempts += 1;
        await new this.sqsMessage(this.body, this.lambda).send();
    }
    async abort() {

    }
}

module.exports = Lambda;
