'use strict';

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
    async send(success = true) {
        const params = this._construct();
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (success === true) {
                    resolve(params);
                } else {
                    reject('Some error occurred!');
                }
            }, 1000);
        });
    }
}

module.exports = StubSQS;
