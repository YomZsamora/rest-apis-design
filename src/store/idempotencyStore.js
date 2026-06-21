const store = new Map();

const TTL_MS = 60 * 60 * 1000; // how long a stored response can be replayed

function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;

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
