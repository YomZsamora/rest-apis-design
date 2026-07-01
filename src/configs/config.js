require('dotenv').config();
const fs = require('fs');

module.exports = {
    development: {
        REDIS_URL: process.env.REDIS_URL,
    },
    staging: {},
    production: {},
    test: {},
    app: {},
};
