require('dotenv').config();

const parseList = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3004,
  isProduction: process.env.NODE_ENV === 'production',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/form_management',

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://127.0.0.1:3000']),

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    submissionMax: Number(process.env.SUBMISSION_RATE_LIMIT_MAX) || 30
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'console',
    from: process.env.EMAIL_FROM || 'noreply@formbuilder.local',
    fromName: process.env.EMAIL_FROM_NAME || 'Form Builder',
    resendApiKey: process.env.RESEND_API_KEY || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: process.env.SMTP_SECURE === 'true'
    }
  },

  uploads: {
    maxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB) || 10,
    allowedMimeTypes: parseList(
      process.env.UPLOAD_ALLOWED_MIME_TYPES,
      [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    )
  },

  requireEmailVerified: process.env.REQUIRE_EMAIL_VERIFIED === 'true',

  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  }
};

const validateRequiredConfig = () => {
  if (!appConfig.jwt.secret) {
    throw new Error('JWT_SECRET is required. Copy .env.example to .env and set it.');
  }
};

module.exports = {
  appConfig,
  validateRequiredConfig
};
