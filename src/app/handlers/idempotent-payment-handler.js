// Demo "create a payment" handler sitting behind idempotencyMiddleware.
// It has no idempotency logic of its own - it just needs to always call
// res.json() (success or error) so the middleware's wrapped res.json can
// cache whatever response it produces.
const crypto = require('crypto');

const idempotentPaymentHandler = async (req, res, next) => {

    const { amount, currency } = req.body;

    if (typeof amount !== 'number' || typeof currency !== 'string') res.status(422).json({ error: 'amount (number) and currency (string) are required' });

    // A new id/timestamp is generated only because this code path runs at
    // most once per idempotency key - retries are served from the cache
    // in the middleware and never reach here, so the same key always maps
    // back to this same payment.
    const payment = {
        id: crypto.randomUUID(),
        amount,
        currency,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
    };

    res.status(201).json(payment);
};

module.exports = { idempotentPaymentHandler };
