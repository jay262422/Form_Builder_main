const rateLimit = require('express-rate-limit');
const { appConfig } = require('./appConfig');

const createLimiter = ({ windowMs, max, message }) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'rate_limit_exceeded',
    message,
    error: {
      type: 'rate_limit_exceeded',
      message
    }
  }
});

const generalLimiter = createLimiter({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: 'Too many requests. Please try again later.'
});

const authLimiter = createLimiter({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.authMax,
  message: 'Too many authentication attempts. Please try again later.'
});

const submissionLimiter = createLimiter({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.submissionMax,
  message: 'Too many submissions. Please try again later.'
});

module.exports = {
  generalLimiter,
  authLimiter,
  submissionLimiter
};
