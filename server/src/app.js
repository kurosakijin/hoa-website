const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const residentRoutes = require('./routes/residentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { requireAdmin } = require('./middleware/auth');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      database: 'mongodb',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/dashboard', requireAdmin, dashboardRoutes);
  app.use('/api/residents', requireAdmin, residentRoutes);
  app.use('/api/payments', requireAdmin, paymentRoutes);
  app.use('/api/chat', requireAdmin, chatRoutes);

  app.use((error, _request, response, _next) => {
    const statusCode = error?.statusCode || (error?.name === 'MulterError' ? 400 : 500);

    response.status(statusCode).json({
      message: error.message || 'Unexpected server error',
    });
  });

  return app;
}

module.exports = createApp;
