const express = require('express');
const dotenv = require('dotenv');
const paymentsRouter = require('./routes/payments');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/', (req, res) => res.send('Welcome to the Dockerized REST APIs App!'));
app.use(paymentsRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
