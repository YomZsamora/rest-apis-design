const { randomUUID } = require('crypto');

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
