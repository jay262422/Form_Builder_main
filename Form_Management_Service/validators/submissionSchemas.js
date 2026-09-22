const Joi = require('joi');
const { paginationQuery } = require('./commonSchemas');

const submissionListQuerySchema = paginationQuery.keys({
  formId: Joi.string().trim(),
  status: Joi.string().trim().max(40)
});

const createSubmissionSchema = Joi.object({
  formId: Joi.string().trim().required(),
  formData: Joi.object().unknown(true).default({}),
  metadata: Joi.object().unknown(true),
  status: Joi.string().valid('draft', 'submitted', 'reviewed', 'archived').default('submitted')
});

const updateSubmissionSchema = Joi.object({
  formData: Joi.object().unknown(true),
  metadata: Joi.object().unknown(true),
  status: Joi.string().valid('draft', 'submitted', 'reviewed', 'archived')
}).min(1);

const submissionIdParamSchema = Joi.object({
  id: Joi.string().trim().required()
});

const formIdParamSchema = Joi.object({
  formId: Joi.string().trim().required()
});

module.exports = {
  submissionListQuerySchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  submissionIdParamSchema,
  formIdParamSchema
};
