'use strict';
const {Project, Folder, Organization, File} = require('@poetry/mongoose').schemas;
const Poetry = require('./utils/lambda');

class Init extends Poetry.Lambda {
    async runLambda() {
        await this.connectDB();
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
    async validateProject() {
        const project = await Project.findOne({_id: this.projectId}).exec();
        if (!project) {
            throw new Error('Project not found');
        }
        if (project.organizationId !== this.organizationId) {
            throw new Error('Organization does not match Project');
        }
    }
    async validateFolder() {
        const folder = await Folder.findOne({_id: this.folderId}).exec();
        if (!folder) {
            throw new Error('Folder not found');
        }
        if (folder.projectId !== this.projectId) {
            throw new Error('Project does not match Folder');
        }
        if (folder.organizationId !== this.organizationId) {
            throw new Error('Organization does not match Folder');
        }
    }
    async doesFileExist() {
        const file = await File.findOne({hash: this.hash}).exec();
        if (!file) {
            return {exists: false, file: undefined};
        }
        return {exists: true, file}
    }
    async appendFile(file) {
        const network = file.networks.find(n => n.name === this.network);
        if (network && network.status !== 'permanently_failed') {
            throw new Error(`The file already exists on network: ${this.network}`);
        }
        await File.updateOne(
            { name: file.name, hash: file.hash },
            { $push: { networks: { name: this.network, contract: this.adapter.getAbiAndAddress().address }  } }
        ).exec();
    }
    async createFile() {
        const file = new File({
            hash: this.hash,
            name: this.fileName,
            organizationId: this.organizationId,
            projectId: this.projectId,
            folderId: this.folderId,
            networks: [{name: this.network, contract: this.adapter.getAbiAndAddress().address}]
        });
        await file.save();
    }
    async handleFile() {
        const {exists, file} = await this.doesFileExist();
        if (exists === true) {
            await this.appendFile(file);
        } else {
            await this.createFile();
        }
    }
}

exports.init = new Init();
exports.handler = new Init().lambda;
