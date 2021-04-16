'use strict';
const adapters = require('@poetry/adapters');
const {connectDB} = require('@poetry/mongoose');

class Lambda {
    constructor() {
        this.lambdas = ['init', 'push', 'success'];
        return {
            lambda: async (event) => {
                try {
                    this.initializeLambda(event);
                    this.setUtils();
                    await this.runLambda();
                } catch (error) {
                    if (this.attempts < 5) {
                        await this.reattempt();
                    } else {
                        await this.abort(error);
                    }
                }
            },
            instance: this
        }
    }
    initializeLambda({body}) {
        const _body = JSON.parse(body);
        this.body = _body;
        this.hash = _body.hash;
        this.fileName = _body.fileName;
        this.projectId = _body.projectId;
        this.folderId = _body.folderId;
        this.organizationId = _body.organizationId;
        this.subscriptionKey = _body.subscriptionKey;
        this.attempts = _body.attempts ? _body.attempts : 0;
        this.network = _body.network;
        this.withIdentity = _body.withIdentity || false;
        this.lambda = _body.lambda;
    }
    setUtils() {
        if (process.env.ENV === 'TEST') {
            const StubAdapter = require('../../test/utils/stubAdapter');
            this.adapter = new StubAdapter();
            this.connectDB = require('../../test/utils/stubConnectDB');
            this.sqsMessage = require('../../test/utils/stubSQS');
        } else {
            this.adapter = new adapters[this.network.charAt(0).toUpperCase() + this.network.slice(1)];
            this.connectDB = connectDB;
        }
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
    async abort(error) {
        throw error;
    }
}

module.exports = {Lambda};
