const getNestedValue = (obj, path) => path.split('.').reduce((current, key) => (
  current && current[key] !== undefined ? current[key] : undefined
), obj);

const parseStringCondition = (conditionString) => {
  const cleanCondition = conditionString.trim();
  const patterns = [
    /^(\w+)\s*==\s*['"`]([^'"`]*)['"`]$/,
    /^(\w+)\s*!=\s*['"`]([^'"`]*)['"`]$/,
    /^(\w+)\s*==\s*(\w+)$/,
    /^(\w+)\s*!=\s*(\w+)$/
  ];

  for (const pattern of patterns) {
    const match = cleanCondition.match(pattern);
    if (match) {
      const [, fieldName, value] = match;
      return {
        field: fieldName,
        operator: cleanCondition.includes('!=') ? 'notEquals' : 'equals',
        value
      };
    }
  }

  return null;
};

const evaluateConditionObject = (condition, formData) => {
  const { field, operator, value } = condition;
  if (!field) return true;

  const fieldValue = getNestedValue(formData, field);

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'notEquals':
      return fieldValue !== value;
    case 'contains':
      return Array.isArray(fieldValue)
        ? fieldValue.includes(value)
        : String(fieldValue).includes(value);
    case 'notContains':
      return Array.isArray(fieldValue)
        ? !fieldValue.includes(value)
        : !String(fieldValue).includes(value);
    case 'greaterThan':
      return Number(fieldValue) > Number(value);
    case 'lessThan':
      return Number(fieldValue) < Number(value);
    case 'greaterThanOrEqual':
      return Number(fieldValue) >= Number(value);
    case 'lessThanOrEqual':
      return Number(fieldValue) <= Number(value);
    case 'isEmpty':
      return fieldValue === null
        || fieldValue === undefined
        || fieldValue === ''
        || (Array.isArray(fieldValue) && fieldValue.length === 0)
        || String(fieldValue).trim() === '';
    case 'isNotEmpty':
      return fieldValue !== null
        && fieldValue !== undefined
        && fieldValue !== ''
        && (Array.isArray(fieldValue) ? fieldValue.length > 0 : String(fieldValue).trim() !== '');
    case 'in':
      return Array.isArray(value) ? value.includes(fieldValue) : false;
    case 'notIn':
      return Array.isArray(value) ? !value.includes(fieldValue) : true;
    default:
      return true;
  }
};

const evaluateCondition = (condition, formData) => {
  if (typeof condition === 'function') {
    return condition(formData);
  }

  if (typeof condition === 'object' && condition !== null) {
    return evaluateConditionObject(condition, formData);
  }

  if (typeof condition === 'boolean') {
    return condition;
  }

  if (typeof condition === 'string' && condition.trim()) {
    const parsedCondition = parseStringCondition(condition);
    if (parsedCondition) {
      return evaluateConditionObject(parsedCondition, formData);
    }
  }

  return true;
};

const shouldShowField = (field, formData) => {
  if (!field?.condition) return true;
  return evaluateCondition(field.condition, formData);
};

module.exports = {
  evaluateCondition,
  shouldShowField
};
