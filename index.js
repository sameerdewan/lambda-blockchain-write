'use strict';
const init = require('./src/01-init');
const push = require('./src/02-push');
const success = require('./src/03-success');

exports.handler = async (event) => {
    switch (JSON.parse(event.body).lambda) {
        case 'init':
            await init.handler(event);
            break;
        case 'push':
            await push.handler(event);
            break;
        case 'success':
            await success.handler(event);
            break
        default:
            throw new Error('Lambda not provided');
    }
};
