const express = require('express');
const crypto = require('crypto');
const idempotency = require('../middleware/idempotency');

const router = express.Router();

router.post('/payments', idempotency, (req, res) => {
    const { amount, currency } = req.body;

    if (typeof amount !== 'number' || typeof currency !== 'string') {
        return res.status(422).json({ error: 'amount (number) and currency (string) are required' });
    }

    const payment = {
        id: crypto.randomUUID(),
        amount,
        currency,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
    };

    res.status(201).json(payment);
});

module.exports = router;
