const express = require('express');
const { IdempotencyMiddlewares } = require('../middlewares/idempotency-middleware');
const { idempotentPaymentHandler } = require('../controllers/idempotent-charge-controller');

const router = express.Router();

router.post('/charge', IdempotencyMiddlewares, idempotentPaymentHandler);

module.exports = router;
