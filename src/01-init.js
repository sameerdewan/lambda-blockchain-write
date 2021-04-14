'use strict';
const adapters = require('@poetry/adapters');
const {connectDB} = require('@poetry/mongoose');
const {Project, Folder, Organization, File} = require('@poetry/mongoose').schemas;

class Init {
    constructor() {
        return async (event) => {
            try {
                this.initializeLambda(event);
                this.setUtils();
                await this.runLambda();
            } catch (error) {
                if (this.attempts <= 5) {
                    await this.reattempt();
                } else {
                    await this.abort(error);
                }
            }
        };
    }
    initializeLambda({body}) {
        this.hash = body.hash;
        this.projectId = body.projectId;
        this.folderId = body.folderId;
        this.organizationId = body.organizationId;
        this.subscriptionKey = body.subscriptionKey;
        this.attempts = body.attempts ? body.attempts : 0;
        this.network = body.network;
    }
    setUtils() {
        if (process.env.ENV === 'TEST') {
            this.adapter = require('../utils/stubAdapter');
            this.connectDB = require('../utils/stubConnectDB');
        } else {
            this.adapter = adapters[this.network];
            this.connectDB = connectDB;
        }
    }
    async runLambda() {

    }
}

exports.handler = new Init();
