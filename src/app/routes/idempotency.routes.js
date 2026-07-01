const express = require('express');
const { idempotencyMiddleware } = require('../middlewares/idempotency.middleware');
const { idempotentPaymentHandler } = require('../controllers/idempotent-charge.controller');

const router = express.Router();

router.post('/charge', idempotencyMiddleware, idempotentPaymentHandler);

module.exports = router;
