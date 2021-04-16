'use strict';
const {File} = require('@poetry/mongoose').schemas;
const Poetry = require('./utils/lambda');

class Success extends Poetry.Lambda {
    async runLambda() {
        await this.connectDB();
        await this.updateFile();
    }
    async updateFile() {
        await File.updateOne(
            { name: this.fileName, hash: this.hash, networks: { $elemMatch: { name: this.network } } },
            { 
                $set: { 
                    'networks.$.contract': this.adapter.getAbiAndAddress().address, 
                    'networks.$.tx': this.tx, 
                    'networks.$.status': 'completed', 
                    'networks.$.onChainDate': new Date() 
                } 
            }
        ).exec();
    }
}

exports.success = new Success();
exports.handler = new Success().lambda;
