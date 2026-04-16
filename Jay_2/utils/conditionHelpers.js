/**
 * Condition Helpers - Functions to evaluate field conditions and dependencies
 */

/**
 * Evaluates a condition (function, object, boolean, or string)
 * @param {*} condition - Condition to evaluate
 * @param {Object} formData - Current form data
 * @returns {boolean} Condition result
 */
export function evaluateCondition(condition, formData) {
  if (typeof condition === 'function') {
    return condition(formData);
  }
  
  if (typeof condition === 'object') {
    return evaluateConditionObject(condition, formData);
  }
  
  if (typeof condition === 'boolean') {
    return condition;
  }
  
  // Handle string conditions (legacy format)
  if (typeof condition === 'string' && condition.trim()) {
    try {
      const parsedCondition = parseStringCondition(condition);
      if (parsedCondition) {
        console.log('🔍 ConditionHelpers: Parsed string condition:', condition, 'to:', parsedCondition);
        return evaluateConditionObject(parsedCondition, formData);
      }
    } catch (error) {
      console.warn('🔍 ConditionHelpers: Failed to parse string condition:', condition, error);
    }
  }
  
  return true;
}

/**
 * Evaluates a condition object
 * @param {Object} condition - Condition object
 * @param {Object} formData - Current form data
 * @returns {boolean} Condition result
 */
function evaluateConditionObject(condition, formData) {
  const { field, operator, value } = condition;
  
  if (!field) return true;
  
  const fieldValue = getNestedValue(formData, field);
  
  // Debug logging
  console.log(`Evaluating condition:`, { field, operator, value, fieldValue, formData });
  
  let result;
  
  switch (operator) {
    case 'equals':
      result = fieldValue === value;
      break;
    case 'notEquals':
      result = fieldValue !== value;
      break;
    case 'contains':
      result = Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(value);
      break;
    case 'notContains':
      result = Array.isArray(fieldValue) ? !fieldValue.includes(value) : !String(fieldValue).includes(value);
      break;
    case 'greaterThan':
      result = Number(fieldValue) > Number(value);
      break;
    case 'lessThan':
      result = Number(fieldValue) < Number(value);
      break;
    case 'greaterThanOrEqual':
      result = Number(fieldValue) >= Number(value);
      break;
    case 'lessThanOrEqual':
      result = Number(fieldValue) <= Number(value);
      break;
    case 'isEmpty':
      result = fieldValue === null || fieldValue === undefined || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0) || String(fieldValue).trim() === '';
      break;
    case 'isNotEmpty':
      result = fieldValue !== null && fieldValue !== undefined && fieldValue !== '' && (Array.isArray(fieldValue) ? fieldValue.length > 0 : String(fieldValue).trim() !== '');
      break;
    case 'in':
      result = Array.isArray(value) ? value.includes(fieldValue) : false;
      break;
    case 'notIn':
      result = Array.isArray(value) ? !value.includes(fieldValue) : true;
      break;
    default:
      result = true;
      break;
  }
  
  console.log(`Condition result:`, { field, operator, value, fieldValue, result });
  return result;
}

/**
 * Parses a string condition into an object format
 * @param {string} conditionString - String condition like "field_name==='value'"
 * @returns {Object|null} Parsed condition object or null if parsing fails
 */
function parseStringCondition(conditionString) {
  // Remove whitespace
  const cleanCondition = conditionString.trim();
  
  // Match patterns like: field_name==='value', field_name!=='value', field_name==="value"
  const patterns = [
    // field_name==='value' or field_name==="value"
    /^(\w+)\s*==\s*['"`]([^'"`]*)['"`]$/,
    // field_name!=='value' or field_name!=="value"
    /^(\w+)\s*!=\s*['"`]([^'"`]*)['"`]$/,
    // field_name==value (without quotes)
    /^(\w+)\s*==\s*(\w+)$/,
    // field_name!=value (without quotes)
    /^(\w+)\s*!=\s*(\w+)$/
  ];
  
  for (const pattern of patterns) {
    const match = cleanCondition.match(pattern);
    if (match) {
      const [, fieldName, value] = match;
      return {
        field: fieldName,
        operator: cleanCondition.includes('!=') ? 'notEquals' : 'equals',
        value: value
      };
    }
  }
  
  return null;
}

/**
 * Gets nested value from object using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Checks if a field should be visible based on its conditions
 * @param {Object} field - Field configuration
 * @param {Object} formData - Current form data
 * @returns {boolean} Should field be visible
 */
export function shouldShowField(field, formData) {
  if (!field.condition) return true;
  return evaluateCondition(field.condition, formData);
}

/**
 * Gets all fields that depend on a specific field
 * @param {Array} schema - Form schema
 * @param {string} fieldName - Name of the field
 * @returns {Array} Array of dependent field configurations
 */
export function getDependentFields(schema, fieldName) {
  const dependents = [];
  
  schema.forEach(section => {
    if (section.fields) {
      section.fields.forEach(field => {
        if (field.dependsOn === fieldName || 
            (field.condition && field.condition.field === fieldName)) {
          dependents.push(field);
        }
      });
    }
  });
  
  return dependents;
}

/**
 * Creates a condition object for field visibility
 * @param {string} field - Field name to check
 * @param {string} operator - Comparison operator
 * @param {*} value - Value to compare against
 * @returns {Object} Condition object
 */
export function createCondition(field, operator, value) {
  return { field, operator, value };
}

/**
 * Creates a condition for when a field equals a value
 * @param {string} field - Field name
 * @param {*} value - Expected value
 * @returns {Object} Condition object
 */
export function whenEquals(field, value) {
  return createCondition(field, 'equals', value);
}

/**
 * Creates a condition for when a field is not empty
 * @param {string} field - Field name
 * @returns {Object} Condition object
 */
export function whenNotEmpty(field) {
  return createCondition(field, 'isNotEmpty');
}

/**
 * Creates a condition for when a field is empty
 * @param {string} field - Field name
 * @returns {Object} Condition object
 */
export function whenEmpty(field) {
  return createCondition(field, 'isEmpty');
}

/**
 * Creates a condition for when a field contains a value
 * @param {string} field - Field name
 * @param {*} value - Value to check for
 * @returns {Object} Condition object
 */
export function whenContains(field, value) {
  return createCondition(field, 'contains', value);
} 