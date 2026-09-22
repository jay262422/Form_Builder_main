const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const passwordSchema = Joi.string().min(8).max(128).pattern(/[A-Za-z]/).pattern(/\d/)
  .messages({
    'string.pattern.base': 'Password must contain at least one letter and one number'
  });

module.exports = {
  objectId,
  paginationQuery,
  passwordSchema
};
