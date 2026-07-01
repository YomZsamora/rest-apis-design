const express = require('express');
const dotenv = require('dotenv');
const paymentsRoutes = require('./app/routes/idempotency-routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/health', (req, res) => res.send('Welcome to the Dockerized REST APIs App!'));
app.use('/v1/idempotency/', paymentsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
