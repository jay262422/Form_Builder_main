const Joi = require('joi');
const { validationError } = require('../utils/responseHelper');

const validate = (schema, source = 'body') => (req, res, next) => {
  const payload = req[source];
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.') || source,
      message: detail.message
    }));

    return validationError(res, 'Validation failed', errors);
  }

  req[source] = value;
  return next();
};

module.exports = validate;
