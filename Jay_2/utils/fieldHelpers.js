/**
 * Field Helpers - Utility functions for field handling
 */

/**
 * Gets dynamic options for a field based on form data
 * @param {Object} field - Field configuration
 * @param {Object} formData - Current form data
 * @returns {Array} Array of options
 */
export function getDynamicOptions(field, formData) {
  if (typeof field.getOptions === 'function') {
    return field.getOptions(field, formData);
  }
  
  if (field.dependsOn && field.dynamicOptions) {
    const dependentValue = formData[field.dependsOn];
    if (Array.isArray(dependentValue)) {
      return dependentValue.flatMap(value => field.dynamicOptions[value] || []);
    }
    return field.dynamicOptions[dependentValue] || [];
  }
  
  return field.options || [];
}

/**
 * Formats field options to standard format
 * @param {Array} options - Raw options
 * @returns {Array} Formatted options
 */
export function formatOptions(options) {
  if (!Array.isArray(options)) return [];
  
  return options.map(option => {
    if (typeof option === 'string') {
      return { label: option, value: option };
    }
    if (typeof option === 'object' && option !== null) {
      return {
        label: option.label || option.name || option.value || '',
        value: option.value || option.id || option.label || option.name || '',
        ...option
      };
    }
    return { label: String(option), value: option };
  });
}

/**
 * Gets field value with proper type conversion
 * @param {Object} field - Field configuration
 * @param {*} value - Raw value
 * @returns {*} Typed value
 */
export function getTypedValue(field, value) {
  if (value === null || value === undefined) {
    return getDefaultValue(field);
  }
  
  switch (field.type) {
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    case 'checkbox':
      return Boolean(value);
    case 'multiselect':
    case 'checkbox-list':
      return Array.isArray(value) ? value : [];
    case 'file':
      return value;
    default:
      return String(value);
  }
}

/**
 * Gets default value for a field type
 * @param {Object} field - Field configuration
 * @returns {*} Default value
 */
function getDefaultValue(field) {
  switch (field.type) {
    case 'number':
      return field.defaultValue || 0;
    case 'checkbox':
      return field.defaultValue || false;
    case 'multiselect':
    case 'checkbox-list':
      return field.defaultValue || [];
    case 'file':
      return field.defaultValue || null;
    default:
      return field.defaultValue || '';
  }
}

/**
 * Validates field value based on field configuration
 * @param {Object} field - Field configuration
 * @param {*} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateFieldValue(field, value) {
  // Required validation
  if (field.required) {
    if (value === null || value === undefined) {
      return 'This field is required';
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'This field is required';
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      return 'This field is required';
    }
  }
  
  // Type-specific validation
  switch (field.type) {
    case 'email':
      if (value && !isValidEmail(value)) {
        return 'Please enter a valid email address';
      }
      break;
    case 'number':
      if (value && isNaN(parseFloat(value))) {
        return 'Please enter a valid number';
      }
      break;
    case 'file':
      if (value && !isValidFile(value, field)) {
        return 'Please select a valid file';
      }
      break;
  }
  
  // Custom validation
  if (field.validate && typeof field.validate === 'function') {
    const customError = field.validate(value);
    if (customError) return customError;
  }
  
  return null;
}

/**
 * Checks if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if file is valid based on field configuration
 * @param {File} file - File to validate
 * @param {Object} field - Field configuration
 * @returns {boolean} Is valid file
 */
function isValidFile(file, field) {
  if (!file) return true;
  
  // Check file type
  if (field.accept) {
    const acceptedTypes = field.accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.startsWith(type);
    });
    if (!isValidType) return false;
  }
  
  // Check file size
  if (field.maxSize && file.size > field.maxSize) {
    return false;
  }
  
  return true;
}

/**
 * Creates a field configuration object
 * @param {string} name - Field name
 * @param {string} type - Field type
 * @param {Object} config - Additional configuration
 * @returns {Object} Field configuration
 */
export function createField(name, type, config = {}) {
  return {
    name,
    type,
    ...config
  };
}

/**
 * Creates a text input field
 * @param {string} name - Field name
 * @param {Object} config - Field configuration
 * @returns {Object} Text input field
 */
export function createTextField(name, config = {}) {
  return createField(name, 'text', config);
}

/**
 * Creates a select field
 * @param {string} name - Field name
 * @param {Array} options - Field options
 * @param {Object} config - Field configuration
 * @returns {Object} Select field
 */
export function createSelectField(name, options = [], config = {}) {
  return createField(name, 'select', {
    options: formatOptions(options),
    ...config
  });
}

/**
 * Creates a multi-select field
 * @param {string} name - Field name
 * @param {Array} options - Field options
 * @param {Object} config - Field configuration
 * @returns {Object} Multi-select field
 */
export function createMultiSelectField(name, options = [], config = {}) {
  return createField(name, 'multiselect', {
    options: formatOptions(options),
    ...config
  });
} 