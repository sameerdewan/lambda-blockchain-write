'use strict';
const {Project, Folder, Organization, File} = require('@poetry/mongoose').schemas;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {assert, expect} = chai;
const rejects = require('assert').rejects;
const sinon = require('sinon');
const {init} = require('../src/01-init');

const rawEvent = {
    body: {
        hash: '17922b3e429fac38dce5c71a00325daa0733ae5e1c2bd3d1c8e0ef0e3a2e261b',
        fileName: 'file.pdf',
        projectId: '607714a8dd1404e6ada8239a',
        folderId: '607714b3deea8050f3cd30a8',
        organizationId: '607714bc58d62e39be398e44',
        subscriptionKey: 'apikey1234abcdefghij0123456789',
        attempts: 0,
        network: 'ethereum',
        lambda: 'init',
        withIdentity: false
    }
};

const event = {
    body: JSON.stringify(rawEvent.body)
};

describe('Init', () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        process.env.ENV = 'TEST';
        sandbox.stub(Organization, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({subscriptionKey: rawEvent.body.subscriptionKey})
            };
        });
        
        sandbox.stub(Project, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({organizationId: rawEvent.body.organizationId})
            };
        });
        
        sandbox.stub(Folder, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({organizationId: rawEvent.body.organizationId, projectId: rawEvent.body.projectId})
            };
        });
        sandbox.stub(File, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({networks: [{name: 'fake-network'}]})
            };
        });
        sandbox.stub(File, 'updateOne').callsFake(() => {
            return {
                exec: () => Promise.resolve()
            };
        });
        sandbox.stub(init.instance, 'fireNextLambda').callsFake(() => {
            return Promise.resolve()
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('process.env.ENV should equal TEST', () => {
        assert.strictEqual(process.env.ENV, 'TEST');
    });
    it('runLambda should be called', async () => {
        sandbox.spy(init.instance, 'runLambda');
        await init.lambda(event);
        assert.isTrue(init.instance.runLambda.calledOnce);
    });
    it('Lambda should be initialized with the correct values referenced on [this]', async () => {
        await init.lambda(event);
        assert.strictEqual(rawEvent.body.hash, init.instance.hash);
        assert.strictEqual(rawEvent.body.fileName, init.instance.fileName);
        assert.strictEqual(rawEvent.body.projectId, init.instance.projectId);
        assert.strictEqual(rawEvent.body.folderId, init.instance.folderId);
        assert.strictEqual(rawEvent.body.organizationId, init.instance.organizationId);
        assert.strictEqual(rawEvent.body.subscriptionKey, init.instance.subscriptionKey);
        assert.strictEqual(rawEvent.body.attempts, init.instance.attempts);
        assert.strictEqual(rawEvent.body.withIdentity, init.instance.withIdentity);
        assert.strictEqual(rawEvent.body.network, init.instance.network);
    });
    it('If process.env.ENV is not TEST, adapter should be a production adapter', async () => {
        process.env.ENV = 'PRODUCTION';
        process.env.ETHEREUM_MNEMONIC = 'shoot culture universe roof index lonely predict win walnut pride spray enable wash essence gaze';
        const Ethereum = require('@poetry/adapters').Ethereum;
        const {abi, address} = require('../node_modules/@poetry/contracts/ethereum/appdata/contract.dev.json');
        sandbox.stub(Ethereum.prototype, 'getAbiAndAddress').returns({abi, address});
        await init.lambda(event);
        assert.isTrue(init.instance.adapter instanceof Ethereum);
    });
    it('validateOrganization: Init should fail if organizationId is not found', async () => {
        Organization.findOne.restore();
        sandbox.stub(Organization, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve(undefined)
            };
        });
        await rejects(init.lambda(event), {message: 'Organization not found'});
    });
    it('validateOrganization: Init should fail if organization subscriptionKey does not match event subscriptionKey', async () => {
        Organization.findOne.restore();
        sandbox.stub(Organization, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({subscriptionKey: 'fake-subscription-key'})
            };
        });
        await rejects(init.lambda(event), {message: 'Subscription Key does not match Organization'});
    });
    it('validateProject: Init should fail if projectId is not found', async () => {
        Project.findOne.restore();
        sandbox.stub(Project, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve(undefined)
            };
        });
        await rejects(init.lambda(event), {message: 'Project not found'});
    });
    it('validateProject: Init should fail if project organizationId does not match event organizationId', async () => {
        Project.findOne.restore();
        sandbox.stub(Project, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({organizationId: 'fake-organization-id'})
            };
        });
        await rejects(init.lambda(event), {message: 'Organization does not match Project'});
    });
    it('validateFolder: Init should fail if folderId is not found', async () => {
        Folder.findOne.restore();
        sandbox.stub(Folder, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve(undefined)
            };
        });
        await rejects(init.lambda(event), {message: 'Folder not found'});
    });
    it('validateFolder: Init should fail if folder projectId does not match event projectId', async () => {
        Folder.findOne.restore();
        sandbox.stub(Folder, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({projectId: 'fake-project-id'})
            };
        });
        await rejects(init.lambda(event), {message: 'Project does not match Folder'});
    });
    it('validateFolder: Init should fail if folder organizationId does not match event organizationId', async () => {
        Folder.findOne.restore();
        sandbox.stub(Folder, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({projectId: rawEvent.body.projectId, organizationId: 'fake-organization-id'})
            };
        });
        await rejects(init.lambda(event), {message: 'Organization does not match Folder'});
    });
    it('handleFile: doesFileExist should return payload of {exists, file} for a not found File', async () => {
        File.findOne.restore();
        sandbox.spy(init.instance, 'doesFileExist');
        sandbox.stub(File, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve(undefined)
            };
        });
        sandbox.stub(File.prototype, 'save').callsFake(() => {
            return Promise.resolve();
        });
        await init.lambda(event);
        assert.isTrue(init.instance.doesFileExist.calledOnce);
        await expect(init.instance.doesFileExist.firstCall.returnValue).to.eventually.deep.equal({exists: false, file: undefined});
    });
    it('handleFile: doesFileExist should return payload of {exists, file} for a found File', async () => {
        File.findOne.restore();
        sandbox.spy(init.instance, 'doesFileExist');
        sandbox.stub(File, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({networks: [{name: 'fake-network'}]})
            };
        });
        await init.lambda(event);
        assert.isTrue(init.instance.doesFileExist.calledOnce);
        await expect(init.instance.doesFileExist.firstCall.returnValue).to.eventually.deep.equal({exists: true, file: {networks: [{name: 'fake-network'}]}});
    });
    it('handleFile: appendFile should be called if file exists', async () => {
        sandbox.spy(init.instance, 'appendFile');
        sandbox.spy(init.instance, 'createFile');
        sandbox.stub(init.instance, 'doesFileExist').callsFake(() => {
            return {
                exists: true,
                file: {networks: [{name: 'fake-network'}]}
            };
        });
        await init.lambda(event);
        assert.isTrue(init.instance.appendFile.calledOnce);
        assert.isTrue(init.instance.appendFile.calledWith({networks: [{name: 'fake-network'}]}));
        assert.isTrue(init.instance.createFile.notCalled);
    });
    it('handleFile: appendFile fail if network is found and network.status !== permanently_failed', async () => {
        File.findOne.restore();
        sandbox.stub(File, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({networks: [{name: rawEvent.body.network, status: 'fake-status'}]})
            };
        });
        await rejects(init.lambda(event), {message: 'The file already exists on network: ethereum'});
    });
    it('handleFile: appendFile succeeds if network is found and network.status === permanently_failed', async () => {
        File.findOne.restore();
        sandbox.stub(File, 'findOne').callsFake(() => {
            return {
                exec: () => Promise.resolve({networks: [{name: rawEvent.body.network, status: 'permanently_failed'}]})
            };
        });
        await init.lambda(event);
    });
    it('handleFile: createFile should be called if file does not exist', async () => {
        sandbox.spy(init.instance, 'appendFile');
        sandbox.spy(init.instance, 'createFile');
        sandbox.stub(init.instance, 'doesFileExist').callsFake(() => {
            return {
                exists: false,
                file: undefined
            };
        });
        sandbox.stub(File.prototype, 'save').callsFake(() => {
            return Promise.resolve();
        });
        await init.lambda(event);
        assert.isTrue(init.instance.createFile.calledOnce);
        assert.isTrue(init.instance.appendFile.notCalled);
    });
    it('fireNextLambda should fire', async () => {
        await init.lambda(event);
        assert.isTrue(init.instance.fireNextLambda.calledOnce);
    });
    it('sqsMessage should be called from fireNextLambda', async () => {
        init.instance.fireNextLambda.restore();
        sandbox.stub(init.instance.sqsMessage.prototype, 'send').callsFake(() => Promise.resolve());
        await init.lambda(event);
        assert.isTrue(init.instance.sqsMessage.prototype.send.calledOnce);
    });
    it('<lambda:init> getNextLambda should return <lambda:push>', async () => {
        await init.lambda(event);
        assert.isTrue(init.instance.getNextLambda() == 'push');
    });
    it('getNextLambda should fail if the lambda calling is <lambda:success>', async () => {
        await init.lambda(event);
        init.instance.lambda = 'success';
        expect(() => init.instance.getNextLambda()).to.throw('There is no lambda following: success');
    });
});
