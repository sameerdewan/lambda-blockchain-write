'use strict';
const {init} = require('../../src/01-init');
const {push} = require('../../src/02-push');
const {success} = require('../../src/03-success');

class StubSQS {
    constructor(body, lambda) {
        this.body = body;
        this.lambda = lambda;
    }
    _construct() {
        const params = {};
        params.MessageBody = JSON.stringify({message: this.body, lambda: this.lambda});
        return params;
    }
    getLambda() {
        if (this.lambda === 'init') {
            return init;
        }
        if (this.lambda === 'push') {
            return push;
        }
        if (this.lambda === 'success') {
            return success;
        }
    }
    async send(success = true) {
        if (success === true) {
            await this.getLambda().lambda({body: JSON.stringify(this.body)});
        } else {
            throw new Error('Some error occurred!');
        }
    }
}

module.exports = StubSQS;
