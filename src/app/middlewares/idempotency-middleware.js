// Enforces idempotent POST semantics: a client-supplied Idempotency-Key
// identifies a single logical operation. Replaying the same key with the
// same body returns the original response; reusing the key with a
// different body is rejected, since that would mean the client is trying
// to make the key mean two different things.
const crypto = require('crypto');
const idempotencyStore = require('../store/idempotencyStore');

// Payloads aren't compared directly because key order / whitespace can
// differ between otherwise-identical requests. Hashing a canonical JSON
// string gives a cheap, fixed-size fingerprint to compare instead.
const hashPayload = (payload) => {
    return crypto.createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
}

const idempotencyMiddleware = (req, res, next) => {

    const key = req.header('Idempotency-Key');

    // No key means the client hasn't opted into idempotent handling, so
    // there's nothing to dedupe against - reject rather than silently
    // processing it as a one-off, non-replayable request.
    if (!key) {
        return res.status(400).json({ error: 'Idempotency-Key header is required' });
    }

    const payloadHash = hashPayload(req.body);
    const cached = idempotencyStore.get(key);

    if (cached) {
        // Same key, different body: the client is reusing an idempotency
        // key for a different operation. 429 signals "back off and use a
        // new key" rather than 409/422, which would suggest the request
        // itself is invalid.
        if (cached.payloadHash !== payloadHash) {
            return res.status(429).json({ error: 'Idempotency key has already been used with a different request payload', });
        }
        // Same key, same body: this is a retry (e.g. a client timeout
        // that resent the request). Replay the original response instead
        // of re-running the handler, so the operation only ever happens once.
        res.set('Idempotent-Replay', 'true');
        return res.status(cached.statusCode).json(cached.body);
    }

    // First time this key has been seen. Wrap res.json so that whatever
    // the downstream handler responds with - success or business-logic
    // error - gets captured and cached against the key for future replays.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        idempotencyStore.set(key, payloadHash, res.statusCode, body);
        return originalJson(body);
    };

    next();
}

module.exports = { idempotencyMiddleware };
