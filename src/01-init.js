'use strict';
const {Project, Folder, Organization, File} = require('@poetry/mongoose').schemas;
const Adapter = require('./utils/adapter');


class Init extends Adapter {
    async runLambda() {
        await this.validateOrganization();
        await this.validateProject();
        await this.validateFolder();
        await this.handleFile();
        await this.fireNextLambda();
    }
    async validateOrganization() {
        const organization = await Organization.findOne({_id: this.organizationId}).exec();
        if (!organization) {
            throw new Error('Organization not found');
        }
        if (organization.subscriptionKey !== this.subscriptionKey) {
            throw new Error('Subscription Key does not match Organization');
        }
    }
}

exports.init = new Init();
exports.handler = new Init().lambda;
