const { body, header } = require('express-validator');

/**
 * Validates the 'amount' field in the request body.
 * Ensures that the amount is present and is a positive integer greater than 1.
 */
const amountFieldValidator = body('amount')
    .exists().withMessage('Charge amount is required.')
    .isInt({ gt: 1 }).withMessage('Charge amount should be a positive integer.');

/**
 * Validates the 'currency' field in the request body.
 * Ensures that the currency is present, is a string, and is one of the allowed values (USD, EUR, GBP, KES).
 */
const currencyFieldValidator = body('currency')
    .exists().withMessage('Currency is required.')
    .isString().withMessage('Currency must be a string.')
    .trim()
    .not().isEmpty().withMessage('Currency cannot be empty.')
    .isIn(['USD', 'EUR', 'GBP', 'KES']).withMessage('Currency must be one of USD, EUR, GBP, or KES.');

/** Validates the 'customerId' field in the request body.
 * Ensures that the customerId is present, is a string, and is not empty.
 */
const customerIdFieldValidator = body('customerId')
    .exists().withMessage('Customer ID is required.')
    .isString().withMessage('Customer ID must be a string.')
    .trim()
    .not().isEmpty().withMessage('Customer ID cannot be empty.');

/** Validates the 'description' field in the request body.
 * Ensures that the description is a string if provided.
 */
const descriptionFieldValidator = body('description')
    .optional()
    .isString().withMessage('Description must be a string.')
    .trim();

/** Validates the 'Idempotency-Key' header in the request.
 * Ensures that the Idempotency-Key is present, is a string, and is not empty.
 */
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
