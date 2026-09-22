/**
 * Form Helper Utilities
 * Functions to help with form initialization and data handling
 */

/**
 * Creates initial form data based on schema
 * @param {Array} schema - Form schema
 * @param {Object} initialData - Initial data to merge
 * @returns {Object} Initial form data
 */
export function createInitialFormData(schema, initialData = {}) {
  if (!Array.isArray(schema)) {
    console.warn('formHelpers: Schema must be an array');
    return { ...initialData };
  }

  const formData = { ...initialData };

  schema.forEach(section => {
    if (section && section.fields && Array.isArray(section.fields)) {
      section.fields.forEach(field => {
        if (field && field.name && formData[field.name] === undefined) {
          formData[field.name] = getDefaultValue(field);
        }
      });
    }
  });

  return formData;
}

/**
 * Gets default value for a field based on its type
 * @param {Object} field - Field configuration
 * @returns {*} Default value
 */
export function getDefaultValue(field) {
  if (!field || typeof field !== 'object') {
    console.warn('formHelpers: Invalid field provided to getDefaultValue');
    return '';
  }

  if (!field.type) {
    console.warn('formHelpers: Field type is required for getDefaultValue');
    return field.defaultValue || '';
  }

  switch (field.type) {
    case 'multiselect':
    case 'checkbox-list':
      return field.defaultValue || [];
    case 'select':
      return field.selectionType === 'multiple' ? (field.defaultValue || []) : (field.defaultValue || '');
    case 'checkbox':
    case 'toggle':
      if (typeof field.defaultValue === 'boolean') return field.defaultValue;
      return Boolean(field.checked);
    case 'range':
      if (field.value !== undefined && field.value !== '') return Number(field.value);
      return 50;
    case 'number':
      return field.defaultValue || '';
    case 'file':
      return field.defaultValue || null;
    default:
      return field.defaultValue || '';
  }
}

/**
 * Validates if a field is required and has a value
 * @param {Object} field - Field configuration
 * @param {*} value - Field value
 * @returns {boolean} Is valid
 */
export function isFieldValid(field, value) {
  if (!field.required) return true;
  
  if (value === null || value === undefined) return false;
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return true;
}

/**
 * Formats form data for submission
 * @param {Object} formData - Raw form data
 * @param {Array} schema - Form schema
 * @returns {Object} Formatted form data
 */
export function formatFormData(formData, schema) {
  const formatted = { ...formData };

  schema.forEach(section => {
    if (section.fields) {
      section.fields.forEach(field => {
        if (field.transform) {
          formatted[field.name] = field.transform(formatted[field.name], formatted);
        }
      });
    }
  });

  return formatted;
}

/**
 * Gets field dependencies (fields that depend on this field)
 * @param {Array} schema - Form schema
 * @param {string} fieldName - Name of the field
 * @returns {Array} Array of dependent field names
 */
export function getFieldDependencies(schema, fieldName) {
  const dependencies = [];

  schema.forEach(section => {
    if (section.fields) {
      section.fields.forEach(field => {
        if (field.dependsOn === fieldName) {
          dependencies.push(field.name);
        }
      });
    }
  });

  return dependencies;
}

/**
 * Resets dependent fields when a parent field changes
 * @param {Object} formData - Current form data
 * @param {Array} schema - Form schema
 * @param {string} changedField - Name of the changed field
 * @returns {Object} Updated form data
 */
export function resetDependentFields(formData, schema, changedField) {
  const updated = { ...formData };
  const dependencies = getFieldDependencies(schema, changedField);

  dependencies.forEach(depFieldName => {
    const depField = findFieldInSchema(schema, depFieldName);
    if (depField) {
      updated[depFieldName] = getDefaultValue(depField);
      // Recursively reset deeper dependencies
      const deeperDeps = resetDependentFields(updated, schema, depFieldName);
      Object.assign(updated, deeperDeps);
    }
  });

  return updated;
}

/**
 * Finds a field in the schema by name
 * @param {Array} schema - Form schema
 * @param {string} fieldName - Name of the field to find
 * @returns {Object|null} Field configuration or null
 */
export function findFieldInSchema(schema, fieldName) {
  for (const section of schema) {
    if (section.fields) {
      for (const field of section.fields) {
        if (field.name === fieldName) {
          return field;
        }
      }
    }
  }
  return null;
} 

/**
 * Check if a form should be rendered as a step-by-step form
 * @param {Object} form - The form object
 * @returns {boolean} - True if it should be step-by-step
 */
export function isStepByStepForm(form) {
  // Check if formType is explicitly set to 'wizard' (either at form level or schema level)
  if (form.formType === 'wizard' || form.schema?.formType === 'wizard') {
    return true;
  }
  
  // Check for specific form types that should be step-by-step
  const stepByStepFormTypes = [
    'vendor_onboarding',
    'vendor_registration', 
    'service_provider_registration',
    'step_form',
    'wizard_form'
  ];
  
  if ((form.formType && stepByStepFormTypes.includes(form.formType)) ||
      (form.schema?.formType && stepByStepFormTypes.includes(form.schema.formType))) {
    return true;
  }

  // Only treat as step-by-step if explicitly configured that way
  return false;
}

/**
 * Get the appropriate form component based on form type
 * @param {Object} form - The form object
 * @returns {string} - 'wizard' or 'builder'
 */
export function getFormComponentType(form) {
  return isStepByStepForm(form) ? 'wizard' : 'builder';
} 
