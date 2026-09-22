const express = require('express');
const path = require('path');
const cors = require('./config/cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { appConfig } = require('./config/appConfig');
const { generalLimiter, authLimiter, submissionLimiter } = require('./config/rateLimit');
const { sanitizeRequestBody } = require('./utils/sanitizeInput');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const fieldOptionsRoutes = require('./routes/fieldOptionsRoutes');
const dynamicMappingsRoutes = require('./routes/dynamicMappingsRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors);
  app.use(compression());
  app.use(morgan(appConfig.isProduction ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(sanitizeRequestBody);
  app.use(generalLimiter);
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'success',
      message: 'Service is healthy',
      data: {
        service: 'Form Management Service',
        environment: appConfig.nodeEnv,
        timestamp: new Date().toISOString()
      }
    });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/forms', formRoutes);
  app.use('/api/field-options', fieldOptionsRoutes);
  app.use('/api/dynamic-mappings', dynamicMappingsRoutes);
  app.use('/api/submissions', submissionLimiter, submissionRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/audit-logs', auditLogRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
