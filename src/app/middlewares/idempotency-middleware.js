/**
 * @file idempotency-middleware.js
 * @description Middleware to handle idempotency for charge requests.
 * This middleware checks for the presence of an Idempotency-Key header and ensures that the same request is not processed multiple times.
 * It validates the required fields and handles errors appropriately.
 */
const redis = require('../../services/cache-service');
const { hashChargePayload } = require('../../utils/hash');
const { handleBadRequests } = require('../../utils/exceptions/exception-handler');
const { BadRequest, UnprocessedEntity } = require('../../utils/exceptions/custom-exceptions');
const {
    amountFieldValidator,
    currencyFieldValidator,
    customerIdFieldValidator,
    descriptionFieldValidator,
    idempotencyKeyHeaderValidator
} = require('../../utils/validators/idempotency-validators');

const IDEMPOTENCY_TTL = 86400; 
const REDIS_KEY_PREFIX = 'idempotency:';

/**
 * Middleware to handle idempotency for charge requests.
 * This middleware checks for the presence of an Idempotency-Key header and ensures that the same request is not processed multiple times.
 * It validates the required fields and handles errors appropriately.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function in the Express stack.
 */
const idempotencyKeyHeaderMiddleware = async (req, res, next) => {
    
    const key = req.header('Idempotency-Key'); // Retrieve the Idempotency-Key from the request headers

    if (!key) throw new BadRequest('Idempotency-Key header is required.'); // If the Idempotency-Key header is missing, throw a BadRequest error

    const stored = await redis.get(`${REDIS_KEY_PREFIX}${key}`); // Check if there is a stored response for the given Idempotency-Key in Redis

    if (stored) {
        const incomingHash = hashChargePayload(req.body);
        if (stored.payloadHash !== incomingHash) throw new UnprocessedEntity(); // If the payload hash does not match, throw an UnprocessedEntity error
        return res.status(200).json({ ...stored.result, idempotent: true }); // If the payload hash matches, return the stored response with a 200 status code and an idempotent flag
    }

    req.idempotencyKey = key; // Store the Idempotency-Key in the request object for later use
    req.payloadHash = hashChargePayload(req.body); // Store the hash of the request payload in the request object for later use
    const originalJson = res.json.bind(res); // Store the original res.json function to call later
    res.json = async (body) => { // Override the res.json function to store the response in Redis before sending it back to the client
        await redis.set(
            `${REDIS_KEY_PREFIX}${key}`,
            { payloadHash: req.payloadHash, result: body, processedAt: new Date().toISOString() },
            IDEMPOTENCY_TTL
        );
        return originalJson(body);
    };
    next();
};

const IdempotencyMiddlewares = [
    amountFieldValidator,
    currencyFieldValidator,
    customerIdFieldValidator,
    descriptionFieldValidator,
    idempotencyKeyHeaderValidator,
    handleBadRequests('An error occurred while processing charge. Please check the request payload and try again.'),
    idempotencyKeyHeaderMiddleware
];

module.exports = { IdempotencyMiddlewares };
