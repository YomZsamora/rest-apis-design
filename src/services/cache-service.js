const redis = require('../configs/redis');

const get = async (key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
}

const set = async (key, value, ttlSeconds) => await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);

const del = (key) => redis.del(key);

const ttl = (key) => redis.ttl(key); 

module.exports = { get, set, del, ttl };
