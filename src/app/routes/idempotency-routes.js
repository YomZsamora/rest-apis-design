const express = require('express');
const { IdempotencyMiddlewares } = require('../middlewares/idempotency-middleware');
const { idempotentPaymentHandler } = require('../controllers/idempotent-charge-controller');

const v1Router = express.Router();

v1Router.post('/charge', IdempotencyMiddlewares, idempotentPaymentHandler);

module.exports = v1Router;
