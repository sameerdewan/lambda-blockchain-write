'use strict';
const Poetry = require('./utils/lambda');

class Push extends Poetry.Lambda {
    async runLambda() {
        this.setIdentity();
        await this.transactPush();
        await this.fireNextLambda();
    }
    setIdentity() {
        if (this.withIdentity) {
            this.identity = this.organizationId;
        }
    }
    async transactPush() {
        const {tx} = await this.adapter.push(this.identity, this.fileName, this.hash);
        this.tx = tx;
        this.body.tx = tx;
    }
}

exports.push = new Push();
exports.handler = new Push().lambda;
