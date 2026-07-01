/**
 * @file idempotent-charge-controller.js
 * @description Controller for handling idempotent payment requests.
 * This controller processes a charge request and ensures that the same request is not processed multiple times.
 * It validates the required fields and handles errors appropriately.
 */
const { processCharge } = require('../../services/charge-service');
const { ApiResponse } = require('../../utils/responses');

/**
 * Controller for handling idempotent payment requests.
 * This controller processes a charge request and ensures that the same request is not processed multiple times.
 * It validates the required fields and handles errors appropriately.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function in the Express stack.
 */
const idempotentPaymentHandler = async (req, res, next) => {
    try {
        const { amount, currency, customerId, description } = req.body;
        const result = await processCharge({ amount, currency, customerId, description });
        const apiResponse = new ApiResponse();
        apiResponse.code = 201;
        apiResponse.message = 'Charge processed successfully.';
        apiResponse.data = result;
        return res.status(apiResponse.code).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

module.exports = { idempotentPaymentHandler };
