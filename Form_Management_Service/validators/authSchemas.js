const Joi = require('joi');
const { passwordSchema } = require('./commonSchemas');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema.required(),
  name: Joi.string().trim().min(2).max(120).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  settings: Joi.object().unknown(true),
  profile: Joi.object({
    timezone: Joi.string().trim().max(80),
    title: Joi.string().trim().max(120),
    company: Joi.string().trim().max(120),
    phone: Joi.string().trim().max(40),
    bio: Joi.string().trim().max(1000),
    avatarUrl: Joi.string().uri().allow('')
  }).unknown(false)
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema.required()
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().allow('', null)
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  logoutSchema
};
