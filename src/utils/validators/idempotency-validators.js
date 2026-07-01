const { body, header } = require('express-validator');

const amountFieldValidator = body('amount')
    .exists().withMessage('Charge amount is required.')
    .isInt({ gt: 1 }).withMessage('Charge amount should be a positive integer.');

const currencyFieldValidator = body('currency')
    .exists().withMessage('Currency is required.')
    .isString().withMessage('Currency must be a string.')
    .trim()
    .not().isEmpty().withMessage('Currency cannot be empty.')
    .isIn(['USD', 'EUR', 'GBP', 'KES']).withMessage('Currency must be one of USD, EUR, GBP, or KES.');

const customerIdFieldValidator = body('customerId')
    .exists().withMessage('Customer ID is required.')
    .isString().withMessage('Customer ID must be a string.')
    .trim()
    .not().isEmpty().withMessage('Customer ID cannot be empty.');

const descriptionFieldValidator = body('description')
    .optional()
    .isString().withMessage('Description must be a string.')
    .trim();

const idempotencyKeyHeaderValidator = header('Idempotency-Key')
    .exists().withMessage('Idempotency-Key header is required.')
    .isString().withMessage('Idempotency-Key must be a string.')
    .trim()
    .not().isEmpty().withMessage('Idempotency-Key cannot be empty.');

module.exports = {
    amountFieldValidator,
    currencyFieldValidator,
    customerIdFieldValidator,
    descriptionFieldValidator,
    idempotencyKeyHeaderValidator
};
