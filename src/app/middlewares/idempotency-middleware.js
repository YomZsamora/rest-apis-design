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

const idempotencyKeyHeaderMiddleware = async (req, res, next) => {
    
    
    const key = req.header('Idempotency-Key');

    if (!key) throw new BadRequest('Idempotency-Key header is required.');

    const stored = await redis.get(`${REDIS_KEY_PREFIX}${key}`);

    if (stored) {
        const incomingHash = hashChargePayload(req.body);
        if (stored.payloadHash !== incomingHash) throw new UnprocessedEntity();
        return res.status(200).json({ ...stored.result, idempotent: true });
    }

    req.idempotencyKey = key;
    req.payloadHash = hashChargePayload(req.body);
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
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
