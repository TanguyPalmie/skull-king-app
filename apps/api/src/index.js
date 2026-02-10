require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { globalLimiter } = require('./middlewares/rateLimit');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(cookieParser());

// Raw body for Stripe webhook
app.use('/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use(globalLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount all routes
app.use('/', routes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(config.PORT, () => {
    console.log(`Taggy API running on port ${config.PORT}`);
  });
}

module.exports = app;
