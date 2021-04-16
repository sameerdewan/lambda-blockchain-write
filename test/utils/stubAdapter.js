'use strict';

class StubAdapter {
    constructor(success = true) {
        this.success = success;
    }
    getAbiAndAddress() {
        const abi = { data: 'stub' };
        const address = '0x3fd4559b19BdA5BF5a3A6E9C9b24298333A8Cb17';
        return {abi, address};
    }
    async push(payload) {
        if (this.success === true) {
            return Promise.resolve({tx: 'stub', payload});
        } else {
            return Promise.reject('Error occurred!');
        }
    }
}

module.exports = StubAdapter;
