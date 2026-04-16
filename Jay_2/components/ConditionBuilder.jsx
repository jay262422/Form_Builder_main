import React, { useState, useEffect } from 'react';

/**
 * ConditionBuilder - User-friendly component to build conditional logic
 */
export default function ConditionBuilder({ 
  condition, 
  onConditionChange, 
  availableFields = [],
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localCondition, setLocalCondition] = useState(condition || {
    field: '',
    operator: 'equals',
    value: ''
  });

  useEffect(() => {
    console.log('🔍 ConditionBuilder: Loading condition:', condition, 'Condition type:', typeof condition);
    setLocalCondition(condition || {
      field: '',
      operator: 'equals',
      value: ''
    });
  }, [condition]);

  const handleSave = () => {
    console.log('🔍 ConditionBuilder: Saving condition:', localCondition, 'Condition type:', typeof localCondition);
    onConditionChange(localCondition);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalCondition(condition || {
      field: '',
      operator: 'equals',
      value: ''
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    onConditionChange(null);
    setIsOpen(false);
  };

  const getOperatorOptions = (fieldType) => {
    const baseOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Not Equals' },
      { value: 'isEmpty', label: 'Is Empty' },
      { value: 'isNotEmpty', label: 'Is Not Empty' }
    ];

    if (fieldType === 'multiselect' || fieldType === 'select') {
      return [
        ...baseOperators,
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Does Not Contain' }
      ];
    }

    if (fieldType === 'number') {
      return [
        ...baseOperators,
        { value: 'greaterThan', label: 'Greater Than' },
        { value: 'lessThan', label: 'Less Than' },
        { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
        { value: 'lessThanOrEqual', label: 'Less Than or Equal' }
      ];
    }

    if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'email') {
      return [
        ...baseOperators,
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Does Not Contain' },
        { value: 'startsWith', label: 'Starts With' },
        { value: 'endsWith', label: 'Ends With' }
      ];
    }

    return baseOperators;
  };

  const getSelectedFieldType = () => {
    const selectedField = availableFields.find(f => f.name === localCondition.field);
    return selectedField?.type || 'text';
  };

  const renderValueInput = () => {
    const fieldType = getSelectedFieldType();
    const operator = localCondition.operator;

    // Don't show value input for isEmpty/isNotEmpty operators
    if (operator === 'isEmpty' || operator === 'isNotEmpty') {
      return null;
    }

    if (fieldType === 'checkbox') {
      return (
        <select
          value={localCondition.value}
          onChange={(e) => setLocalCondition(prev => ({ ...prev, value: e.target.value }))}
          className="w-full p-2 border rounded"
        >
          <option value="">Select value...</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    if (fieldType === 'number') {
      return (
        <input
          type="number"
          value={localCondition.value}
          onChange={(e) => setLocalCondition(prev => ({ ...prev, value: e.target.value }))}
          placeholder="Enter number..."
          className="w-full p-2 border rounded"
        />
      );
    }

    return (
      <input
        type="text"
        value={localCondition.value}
        onChange={(e) => setLocalCondition(prev => ({ ...prev, value: e.target.value }))}
        placeholder="Enter value..."
        className="w-full p-2 border rounded"
      />
    );
  };

  const formatCondition = (condition) => {
    if (!condition || !condition.field) return 'No condition set';
    
    const field = availableFields.find(f => f.name === condition.field);
    const fieldLabel = field?.label || condition.field;
    
    let operatorText = '';
    switch (condition.operator) {
      case 'equals': operatorText = 'equals'; break;
      case 'notEquals': operatorText = 'does not equal'; break;
      case 'contains': operatorText = 'contains'; break;
      case 'notContains': operatorText = 'does not contain'; break;
      case 'isEmpty': operatorText = 'is empty'; break;
      case 'isNotEmpty': operatorText = 'is not empty'; break;
      case 'greaterThan': operatorText = 'is greater than'; break;
      case 'lessThan': operatorText = 'is less than'; break;
      default: operatorText = condition.operator;
    }

    if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') {
      return `When "${fieldLabel}" ${operatorText}`;
    }

    return `When "${fieldLabel}" ${operatorText} "${condition.value}"`;
  };

  return (
    <div className={`condition-builder ${className}`}>
      {/* Display current condition */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Condition:</span>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {formatCondition(condition)}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isOpen ? 'Cancel' : condition ? 'Edit' : 'Add Condition'}
          </button>
        </div>
      </div>

      {/* Condition builder form */}
      {isOpen && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <h4 className="font-medium text-gray-900">Set Field Condition</h4>
          
          {/* Field selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              When this field:
            </label>
            <select
              value={localCondition.field}
              onChange={(e) => setLocalCondition(prev => ({ 
                ...prev, 
                field: e.target.value,
                operator: 'equals', // Reset operator when field changes
                value: '' // Reset value when field changes
              }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a field...</option>
              {availableFields.map(field => (
                <option key={field.name} value={field.name}>
                  {field.label || field.name}
                </option>
              ))}
            </select>
          </div>

          {/* Operator selection */}
          {localCondition.field && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator:
              </label>
              <select
                value={localCondition.operator}
                onChange={(e) => setLocalCondition(prev => ({ 
                  ...prev, 
                  operator: e.target.value,
                  value: '' // Reset value when operator changes
                }))}
                className="w-full p-2 border rounded"
              >
                {getOperatorOptions(getSelectedFieldType()).map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Value input */}
          {localCondition.field && localCondition.operator && 
           localCondition.operator !== 'isEmpty' && 
           localCondition.operator !== 'isNotEmpty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value:
              </label>
              {renderValueInput()}
            </div>
          )}

          {/* Preview */}
          {localCondition.field && (
            <div className="p-3 bg-white border rounded">
              <span className="text-sm text-gray-600">Preview: </span>
              <span className="text-sm font-medium">
                {formatCondition(localCondition)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!localCondition.field}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Condition
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            {condition && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove Condition
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
