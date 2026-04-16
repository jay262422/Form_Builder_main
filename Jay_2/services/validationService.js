/**
 * Enhanced Validation Service
 * Handles pattern validation, custom validation functions, and error messages
 */

class ValidationService {
  constructor() {
    this.validationTemplates = {
      email: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        message: 'Please enter a valid email address'
      },
      phone: {
        pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,}$',
        message: 'Please enter a valid phone number'
      },
      url: {
        pattern: '^https?:\\/\\/.+',
        message: 'Please enter a valid URL'
      },
      zipcode: {
        pattern: '^[0-9]{5}(-[0-9]{4})?$',
        message: 'Please enter a valid ZIP code'
      },
      password: {
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
      },
      creditCard: {
        pattern: '^[0-9]{4}[-\\s]?[0-9]{4}[-\\s]?[0-9]{4}[-\\s]?[0-9]{4}$',
        message: 'Please enter a valid credit card number'
      },
      dateFormat: {
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        message: 'Please enter date in YYYY-MM-DD format'
      },
      alphanumeric: {
        pattern: '^[a-zA-Z0-9]+$',
        message: 'Only letters and numbers are allowed'
      },
      noSpaces: {
        pattern: '^\\S+$',
        message: 'Spaces are not allowed'
      }
    };
  }

  /**
   * Validate a field value against all validation rules
   * @param {string} value - The field value to validate
   * @param {object} validation - Validation rules object
   * @param {object} formData - Complete form data for cross-field validation
   * @returns {object} - { isValid: boolean, errors: string[] }
   */
  validateField(value, validation, formData = {}) {
    const errors = [];

    // Required validation
    if (validation.required && (!value || value.trim() === '')) {
      errors.push(validation.customMessage || 'This field is required');
      return { isValid: false, errors };
    }

    // Skip other validations if value is empty and not required
    if (!value || value.trim() === '') {
      return { isValid: true, errors: [] };
    }

    // Min length validation
    if (validation.minLength && value.length < parseInt(validation.minLength)) {
      errors.push(validation.customMessage || `Minimum length is ${validation.minLength} characters`);
    }

    // Max length validation
    if (validation.maxLength && value.length > parseInt(validation.maxLength)) {
      errors.push(validation.customMessage || `Maximum length is ${validation.maxLength} characters`);
    }

    // Pattern validation
    if (validation.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          errors.push(validation.customMessage || 'Value does not match the required pattern');
        }
      } catch (error) {
        console.error('Invalid regex pattern:', validation.pattern);
        errors.push('Invalid validation pattern');
      }
    }

    // Number range validation
    if (validation.min !== undefined && validation.min !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < parseFloat(validation.min)) {
        errors.push(validation.customMessage || `Minimum value is ${validation.min}`);
      }
    }

    if (validation.max !== undefined && validation.max !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue > parseFloat(validation.max)) {
        errors.push(validation.customMessage || `Maximum value is ${validation.max}`);
      }
    }

    // Custom validation function
    if (validation.customValidation) {
      try {
        const isValid = this.executeCustomValidation(value, validation.customValidation, formData);
        if (!isValid) {
          errors.push(validation.customMessage || 'Custom validation failed');
        }
      } catch (error) {
        console.error('Custom validation error:', error);
        errors.push('Custom validation error');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute custom validation function
   * @param {string} value - Field value
   * @param {string} customFunction - JavaScript function as string
   * @param {object} formData - Complete form data
   * @returns {boolean} - Validation result
   */
  executeCustomValidation(value, customFunction, formData) {
    try {
      // Create a safe execution environment
      const functionBody = customFunction.trim();
      
      // Basic security check - prevent dangerous operations
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /document\./,
        /window\./,
        /localStorage\./,
        /sessionStorage\./,
        /fetch\s*\(/,
        /XMLHttpRequest/,
        /import\s+/,
        /require\s*\(/
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(functionBody)) {
          throw new Error('Dangerous operation detected');
        }
      }

      // Create function with limited scope
      const validationFunction = new Function('value', 'formData', functionBody);
      return validationFunction(value, formData);
    } catch (error) {
      console.error('Custom validation execution error:', error);
      return false;
    }
  }

  /**
   * Test a regex pattern against a value
   * @param {string} pattern - Regex pattern
   * @param {string} value - Value to test
   * @returns {boolean} - Whether pattern matches
   */
  testPattern(pattern, value) {
    try {
      const regex = new RegExp(pattern);
      return regex.test(value);
    } catch (error) {
      console.error('Invalid regex pattern:', pattern);
      return false;
    }
  }

  /**
   * Get validation template by name
   * @param {string} templateName - Name of the template
   * @returns {object|null} - Template object or null
   */
  getTemplate(templateName) {
    return this.validationTemplates[templateName] || null;
  }

  /**
   * Get all available validation templates
   * @returns {object} - All validation templates
   */
  getAllTemplates() {
    return this.validationTemplates;
  }

  /**
   * Validate a complete form
   * @param {object} formData - Form data object
   * @param {object} formSchema - Form schema with validation rules
   * @returns {object} - { isValid: boolean, errors: object }
   */
  validateForm(formData, formSchema) {
    const errors = {};
    let isValid = true;

    // Extract all fields from schema
    const fields = this.extractFields(formSchema);

    // Validate each field
    for (const field of fields) {
      if (field.validation) {
        const value = formData[field.name] || '';
        const validationResult = this.validateField(value, field.validation, formData);
        
        if (!validationResult.isValid) {
          errors[field.name] = validationResult.errors;
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }

  /**
   * Extract all fields from form schema
   * @param {object} schema - Form schema
   * @returns {array} - Array of field objects
   */
  extractFields(schema) {
    const fields = [];

    if (schema.sections) {
      for (const section of schema.sections) {
        if (section.fields) {
          fields.push(...section.fields);
        }
      }
    } else if (schema.fields) {
      fields.push(...schema.fields);
    }

    return fields;
  }

  /**
   * Get default error messages for common validation types
   * @returns {object} - Default error messages
   */
  getDefaultMessages() {
    return {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      phone: 'Please enter a valid phone number',
      number: 'Please enter a valid number',
      minLength: 'Minimum length is {min} characters',
      maxLength: 'Maximum length is {max} characters',
      min: 'Minimum value is {min}',
      max: 'Maximum value is {max}',
      pattern: 'Value does not match the required pattern',
      custom: 'Custom validation failed'
    };
  }
}

// Export singleton instance
const validationService = new ValidationService();
export default validationService;
