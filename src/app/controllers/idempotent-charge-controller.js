const { processCharge } = require('../../services/charge-service');
const { ApiResponse } = require('../../utils/responses');

const idempotentPaymentHandler = async (req, res, next) => {

    try {

        const { amount, currency, customerId, description } = req.body;

        if (typeof amount !== 'number' || typeof currency !== 'string' || typeof customerId !== 'string') {
            return res.status(400).json({
                error: 'missing_fields',
                message: 'amount (number), currency (string), and customerId (string) are required.'
            });
        }

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
