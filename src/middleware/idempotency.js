const crypto = require('crypto');
const idempotencyStore = require('../store/idempotencyStore');

function hashPayload(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
}

function idempotency(req, res, next) {
    const key = req.header('Idempotency-Key');

    if (!key) {
        return res.status(400).json({ error: 'Idempotency-Key header is required' });
    }

    const payloadHash = hashPayload(req.body);
    const cached = idempotencyStore.get(key);

    if (cached) {
        if (cached.payloadHash !== payloadHash) {
            return res.status(429).json({
                error: 'Idempotency key has already been used with a different request payload',
            });
        }

        res.set('Idempotent-Replay', 'true');
        return res.status(cached.statusCode).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        idempotencyStore.set(key, payloadHash, res.statusCode, body);
        return originalJson(body);
    };

    next();
}

module.exports = idempotency;
