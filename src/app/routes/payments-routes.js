const express = require('express');
const { idempotencyMiddleware } = require('../middlewares/idempotency-middleware');
const { idempotentPaymentHandler } = require('../handlers/idempotent-payment-handler');

const router = express.Router();

router.post('/', idempotencyMiddleware, idempotentPaymentHandler);

module.exports = router;
