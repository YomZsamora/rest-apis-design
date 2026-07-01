const crypto = require('crypto');

const hashChargePayload = (chargePayload) => crypto.createHash('sha256').update(JSON.stringify(chargePayload ?? {})).digest('hex');

module.exports = { hashChargePayload };
