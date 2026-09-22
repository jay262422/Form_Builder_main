import { shouldShowField } from './conditionHelpers';

/**
 * FormValidator - Handles form validation with custom rules
 */
export default class FormValidator {
  constructor(customRules = {}) {
    this.customRules = customRules;
    this.defaultRules = {
      required: (value) => {
        if (value === null || value === undefined) return 'This field is required';
        if (Array.isArray(value) && value.length === 0) return 'This field is required';
        if (typeof value === 'string' && value.trim().length === 0) return 'This field is required';
        if (typeof value === 'object') {
          const populatedValues = Object.values(value).filter((item) => {
            if (item === null || item === undefined) return false;
            if (typeof item === 'string') return item.trim().length > 0;
            return true;
          });

          if (populatedValues.length === 0) return 'This field is required';
        }
        return null;
      },
      email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Please enter a valid email address';
      },
      phone: (value) => {
        if (!value) return null;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Please enter a valid phone number';
      },
      minLength: (value, min) => {
        if (!value) return null;
        if (typeof value === 'string' && value.length < min) {
          return `Must be at least ${min} characters long`;
        }
        if (Array.isArray(value) && value.length < min) {
          return `Must select at least ${min} items`;
        }
        return null;
      },
      maxLength: (value, max) => {
        if (!value) return null;
        if (typeof value === 'string' && value.length > max) {
          return `Must be no more than ${max} characters long`;
        }
        if (Array.isArray(value) && value.length > max) {
          return `Must select no more than ${max} items`;
        }
        return null;
      },
      pattern: (value, pattern) => {
        if (!value) return null;
        const regex = new RegExp(pattern);
        return regex.test(value) ? null : 'Invalid format';
      },
      number: (value) => {
        if (!value) return null;
        return !isNaN(value) && !isNaN(parseFloat(value)) ? null : 'Must be a valid number';
      },
      min: (value, min) => {
        if (!value) return null;
        const num = parseFloat(value);
        return !isNaN(num) && num >= min ? null : `Must be at least ${min}`;
      },
      max: (value, max) => {
        if (!value) return null;
        const num = parseFloat(value);
        return !isNaN(num) && num <= max ? null : `Must be no more than ${max}`;
      },
      url: (value) => {
        if (!value) return null;
        try {
          new URL(value);
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      },
      fileSize: (value, maxSize) => {
        if (!value || !value.size) return null;
        return value.size <= maxSize ? null : `File size must be less than ${this.formatFileSize(maxSize)}`;
      },
      fileType: (value, allowedTypes) => {
        if (!value || !value.type) return null;
        const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
        return types.some(type => value.type.startsWith(type)) ? null : `File type not allowed`;
      }
    };
  }

  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validates a single field
   * @param {string} fieldName - Name of the field
   * @param {*} value - Field value
   * @param {Object} fieldSchema - Field configuration
   * @param {Object} formData - Entire form data
   * @returns {string|null} Error message or null if valid
   */
  validateField(fieldName, value, fieldSchema, formData = {}) {
    if (!fieldSchema) {
      console.warn('FormValidator: No field schema provided for validation');
      return 'Invalid field configuration';
    }

    const rules = fieldSchema.validation || {};
    
    // Check required first
    if (rules.required || fieldSchema.required) {
      const requiredError = this.defaultRules.required(value);
      if (requiredError) return requiredError;
    }

    // Check other validation rules
    for (const [ruleName, ruleValue] of Object.entries(rules)) {
      if (ruleName === 'required') continue; // Already checked

      let error = null;

      // Check custom rules first
      if (this.customRules[ruleName]) {
        error = this.customRules[ruleName](value, ruleValue, formData);
      }
      // Then check default rules
      else if (this.defaultRules[ruleName]) {
        error = this.defaultRules[ruleName](value, ruleValue);
      }

      if (error) return error;
    }

    // Check custom validation function
    if (fieldSchema.validate) {
      const customError = fieldSchema.validate(value, formData);
      if (customError) return customError;
    }

    const typeError = this.validateByType(fieldName, value, fieldSchema, formData);
    if (typeError) return typeError;

    return null;
  }

  /**
   * Applies checks that come from the field type and its builder settings.
   */
  validateByType(fieldName, value, fieldSchema, formData = {}) {
    if (fieldSchema.type === 'password' && fieldSchema.confirmPassword) {
      const confirm = formData[`${fieldName}__confirm`] ?? '';
      if (String(value ?? '') !== String(confirm)) {
        return 'Passwords do not match';
      }
    }

    if (value === null || value === undefined || value === '') return null;

    const formatKind = fieldSchema.type === 'text' ? fieldSchema.type : (fieldSchema.inputType || fieldSchema.type);
    if ((fieldSchema.type === 'email' || formatKind === 'email') && fieldSchema.validateEmail !== false) {
      return this.defaultRules.email(value);
    }
    if ((fieldSchema.type === 'url' || formatKind === 'url') && fieldSchema.validateUrl !== false) {
      return this.defaultRules.url(value);
    }

    const selectionCap = Number(fieldSchema.maxSelections);
    const isMulti = fieldSchema.type === 'multiselect' || fieldSchema.selectionType === 'multiple';
    if (isMulti && selectionCap > 0 && Array.isArray(value) && value.length > selectionCap) {
      return `Select at most ${selectionCap} options`;
    }

    return null;
  }

  /**
   * Validates entire form
   * @param {Object} formData - Form data
   * @param {Array} schema - Form schema
   * @returns {Object} Object with field names as keys and error messages as values
   */
  validateForm(formData, schema) {
    const errors = {};

    schema.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          if (!shouldShowField(field, formData)) {
            return;
          }

          const value = formData[field.name];
          const error = this.validateField(field.name, value, field, formData);
          if (error) {
            errors[field.name] = error;
          }
        });
      }
    });

    return errors;
  }

  /**
   * Checks if form is valid
   * @param {Object} formData - Form data
   * @param {Array} schema - Form schema
   * @returns {boolean} Is form valid
   */
  isFormValid(formData, schema) {
    const errors = this.validateForm(formData, schema);
    return Object.keys(errors).length === 0;
  }

  /**
   * Gets validation rules for a field
   * @param {Object} fieldSchema - Field configuration
   * @returns {Object} Validation rules
   */
  getFieldRules(fieldSchema) {
    return {
      ...fieldSchema.validation,
      required: fieldSchema.required || fieldSchema.validation?.required
    };
  }
}

/**
 * Helper function to format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
