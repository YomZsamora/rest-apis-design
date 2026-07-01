const express = require('express');
const { idempotencyMiddleware } = require('../middlewares/idempotency.middleware');
const { idempotentPaymentHandler } = require('../controllers/idempotent-charge.controller');

const router = express.Router();

router.post('/', idempotencyMiddleware, idempotentPaymentHandler);

module.exports = router;
