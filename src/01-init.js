'use strict';
const Adapter = require('./utils/adapter');

class Init extends Adapter {
    async runLambda() {

    }
}

exports.init = new Init();
exports.handler = new Init().lambda;
