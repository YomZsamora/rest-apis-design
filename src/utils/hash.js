const crypto = require('crypto');

/**
 * Generates a SHA-256 hash of the given charge payload.
 * @param {Object} chargePayload - The charge payload to hash.
 * @returns {string} The SHA-256 hash of the charge payload.
 */
const hashChargePayload = (chargePayload) => crypto.createHash('sha256').update(JSON.stringify(chargePayload ?? {})).digest('hex');

module.exports = { hashChargePayload };
