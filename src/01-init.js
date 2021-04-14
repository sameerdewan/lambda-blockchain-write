'use strict';
const adapters = require('@poetry/adapters');
const {connectDB} = require('@poetry/mongoose');
const {Project, Folder, Organization, File} = require('@poetry/mongoose').schemas;

class Init {
    constructor() {
        return async (event) => {
            try {
                this.initializeLambda(event);
                await connectDB();
            } catch (error) {
                if (this.attempts <= 5) {
                    await this.reattempt();
                } else {
                    await this.abort();
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
        this.adapter = adapters[body.network];
    }
}

exports.handler = new Init();
