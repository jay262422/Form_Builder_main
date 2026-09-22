const Form = require('../models/Form');
const { shouldShowField } = require('./conditionHelpers');

const getSectionsFromForm = (form) => {
  const schema = form?.schema;
  if (!schema) return [];
  if (Array.isArray(schema.sections)) return schema.sections;
  if (Array.isArray(schema)) return schema;
  return [];
};

const flattenFields = (sections = []) => sections.flatMap((section) => section.fields || []);

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    return Object.values(value).every((item) => isEmptyValue(item));
  }
  return false;
};

const validateSubmissionAgainstForm = (form, formData = {}) => {
  const errors = [];
  const sections = getSectionsFromForm(form);
  const fields = flattenFields(sections);

  fields.forEach((field) => {
    if (!field?.name) return;

    const visible = shouldShowField(field, formData, sections);
    if (!visible) return;

    const value = formData[field.name];
    const isRequired = field.required === true || field.validation?.required === true;

    if (isRequired && isEmptyValue(value)) {
      errors.push({
        field: field.name,
        message: `${field.label || field.name} is required`
      });
    }
  });

  return errors;
};

const canSubmitToForm = (form, reqUserId) => {
  if (!form) {
    return { allowed: false, reason: 'Form not found' };
  }

  if (!form.status?.isPublished) {
    return { allowed: false, reason: 'Form is not published' };
  }

  if (form.settings?.requireAuthentication && !reqUserId) {
    return { allowed: false, reason: 'Authentication is required to submit this form' };
  }

  return { allowed: true };
};

module.exports = {
  getSectionsFromForm,
  validateSubmissionAgainstForm,
  canSubmitToForm
};
