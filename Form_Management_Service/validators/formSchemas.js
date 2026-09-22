const Joi = require('joi');
const { paginationQuery } = require('./commonSchemas');

const formListQuerySchema = paginationQuery.keys({
  type: Joi.string().trim().max(80),
  isPublished: Joi.boolean().truthy('true').falsy('false'),
  isTemplate: Joi.boolean().truthy('true').falsy('false')
});

const formSchemaPayload = Joi.object().unknown(true);

const createFormSchema = Joi.object({
  id: Joi.string().trim().max(120),
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow(''),
  type: Joi.string().trim().max(80),
  schema: formSchemaPayload.required(),
  settings: Joi.object().unknown(true),
  status: Joi.object({
    isPublished: Joi.boolean(),
    isTemplate: Joi.boolean()
  }),
  metadata: Joi.object().unknown(true),
  statistics: Joi.object().unknown(true),
  ui_part: Joi.object().unknown(true)
});

const updateFormSchema = createFormSchema.fork(['name', 'schema'], (schema) => schema.optional()).min(1);

const formIdParamSchema = Joi.object({
  id: Joi.string().trim().required()
});

const restoreVersionParamSchema = Joi.object({
  id: Joi.string().trim().required(),
  versionNumber: Joi.number().integer().min(1).required()
});

module.exports = {
  formListQuerySchema,
  createFormSchema,
  updateFormSchema,
  formIdParamSchema,
  restoreVersionParamSchema
};
