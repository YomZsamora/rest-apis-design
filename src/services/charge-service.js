/**
 * @file charge-service.js
 * @description Service for processing charges.
 * This service provides a method to process a charge request and return the result.
 */
const { randomUUID } = require('crypto');

/**
 * Processes a charge request.
 * This function simulates processing a charge by generating a unique charge ID and returning the charge details.
 *
 * @param {Object} params - The parameters for the charge request.
 * @param {number} params.amount - The amount to be charged.
 * @param {string} params.currency - The currency of the charge.
 * @param {string} params.customerId - The ID of the customer being charged.
 * @param {string} params.description - A description of the charge.
 * @returns {Promise<Object>} A promise that resolves to an object containing the charge details.
 */
async function processCharge({ amount, currency, customerId, description }) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
        chargeId: `ch_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        amount,
        currency,
        customerId,
        description,
        status: 'success',
        createdAt: new Date().toISOString(),
    };
}

module.exports = { processCharge };
