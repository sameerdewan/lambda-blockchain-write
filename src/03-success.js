'use strict';
const Poetry = require('./utils/lambda');

class Success extends Poetry.Lambda {
    async runLambda() {
        
    }
}

exports.success = new Success();
exports.handler = new Success().lambda;
