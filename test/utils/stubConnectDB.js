'use strict';

function stubConnectDB(success = true) {
    if (success === true) {
        return Promise.resolve();
    }
    return Promise.reject();
}

module.exports = stubConnectDB;
