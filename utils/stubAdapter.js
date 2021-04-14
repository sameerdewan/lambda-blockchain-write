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
    push(payload) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.success === true) {
                    resolve({tx: 'stub', payload});
                } else {
                    reject('stub err');
                }
            }, 1000);
        });
    }
}

module.exports = StubAdapter;
