/**
 * @file cache-service.js
 * @description Service for interacting with Redis cache.
 * This service provides methods to get, set, delete, and check the time-to-live (TTL) of keys in Redis.
 */
const redis = require('../configs/redis');

/**
 * Retrieves a value from Redis by key.
 * @param {string} key - The key to retrieve the value for.
 * @returns {Promise<any>} A promise that resolves to the parsed value, or null if the key does not exist.
 */
const get = async (key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Sets a value in Redis with an optional TTL (time-to-live).
 * @param {string} key - The key under which the value will be stored.
 * @param {any} value - The value to be stored. It will be stringified before storing.
 * @param {number} ttlSeconds - Optional. The time-to-live in seconds. If not provided, the key will persist indefinitely.
 * @returns {Promise<void>} A promise that resolves when the value is set.
 */
const set = async (key, value, ttlSeconds) => await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);

/**
 * Deletes a key from Redis.
 * @param {string} key - The key to be deleted.
 * @returns {Promise<number>} A promise that resolves to the number of keys that were removed.
 */
const del = (key) => redis.del(key);

/**
 * Retrieves the time-to-live (TTL) of a key in Redis.
 * @param {string} key - The key to check the TTL for.
 * @returns {Promise<number>} A promise that resolves to the TTL in seconds, or -1 if the key does not exist or does not have an associated TTL.
 */
const ttl = (key) => redis.ttl(key); 

module.exports = { get, set, del, ttl };
