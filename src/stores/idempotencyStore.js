// In-memory cache mapping an Idempotency-Key to the payload it was used
// with and the response that was returned for it. A real deployment would
// back this with something shared across instances (e.g. Redis) so a
// retry that lands on a different server still gets the cached response;
// an in-process Map only works for a single instance, which is fine for
// demonstrating the concept.
const store = new Map();

const TTL_MS = 60 * 60 * 1000; // how long a stored response can be replayed

function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;

    // Expiry is checked lazily on read instead of with a timer, so the
    // store doesn't need any background sweeping - an expired entry is
    // simply treated as if it were never cached, and the key becomes
    // reusable for a brand new operation.
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
    }

    return entry;
}

function set(key, payloadHash, statusCode, body) {
    store.set(key, {
        payloadHash,
        statusCode,
        body,
        expiresAt: Date.now() + TTL_MS,
    });
}

module.exports = { get, set };
