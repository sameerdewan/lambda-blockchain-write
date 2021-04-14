'use strict';

function stubConnectDB(success = true) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (success === true) {
                resolve();
            } else {
                reject();
            }
        }, 1000);
    });
}

module.exports = stubConnectDB;
