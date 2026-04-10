const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const residentRoutes = require('./routes/residentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const chatRoutes = require('./routes/chatRoutes');
const contentRoutes = require('./routes/contentRoutes');
const { requireAdmin } = require('./middleware/auth');

function createApp() {
  const app = express();

  app.set('trust proxy', true);
  const allowedOrigins = new Set(
    [
      process.env.PUBLIC_SITE_URL,
      process.env.ADMIN_SITE_URL,
      process.env.CORS_ALLOWED_ORIGINS,
      'https://www.saguing-hoa.com',
      'https://saguing-hoa.com',
      'https://admin.saguing-hoa.com',
    ]
      .flatMap((value) => String(value || '').split(','))
      .map((value) => value.trim())
      .filter(Boolean)
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('CORS blocked this origin.'));
      },
      credentials: true,
    })
  );
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
  app.use('/api/content', requireAdmin, contentRoutes);

  app.use((error, _request, response, _next) => {
    const statusCode = error?.statusCode || (error?.name === 'MulterError' ? 400 : 500);

    response.status(statusCode).json({
      message: error.message || 'Unexpected server error',
    });
  });

  return app;
}

module.exports = createApp;
