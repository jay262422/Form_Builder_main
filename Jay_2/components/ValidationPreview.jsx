import React, { useState, useEffect } from 'react';
import validationService from '../services/validationService';

/**
 * ValidationPreview - Component for testing validation rules in real-time
 * Shows validation results and helps users understand their validation setup
 */
export default function ValidationPreview({
  validation,
  fieldType = 'text',
  onValidationChange
}) {
  const [testValue, setTestValue] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Test validation when test value or validation rules change
  useEffect(() => {
    if (testValue !== '' || validation.required) {
      const result = validationService.validateField(testValue, validation);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [testValue, validation]);

  // Get validation status color
  const getStatusColor = () => {
    if (!validationResult) return 'gray';
    return validationResult.isValid ? 'green' : 'red';
  };

  // Get validation status text
  const getStatusText = () => {
    if (!validationResult) return 'No validation rules set';
    return validationResult.isValid ? 'Valid' : 'Invalid';
  };

  // Get validation summary
  const getValidationSummary = () => {
    const rules = [];
    
    if (validation.required) rules.push('Required');
    if (validation.minLength) rules.push(`Min length: ${validation.minLength}`);
    if (validation.maxLength) rules.push(`Max length: ${validation.maxLength}`);
    if (validation.pattern) rules.push('Pattern validation');
    if (validation.min !== undefined && validation.min !== '') rules.push(`Min value: ${validation.min}`);
    if (validation.max !== undefined && validation.max !== '') rules.push(`Max value: ${validation.max}`);
    if (validation.customValidation) rules.push('Custom validation');
    
    return rules.length > 0 ? rules.join(', ') : 'No rules';
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Validation Preview</h4>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Test Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Value
        </label>
        <div className="flex gap-2">
          <input
            type={fieldType}
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationResult ? 
                (validationResult.isValid ? 'border-green-500' : 'border-red-500') : 
                'border-gray-300'
            }`}
            placeholder={`Enter test value for ${fieldType} field...`}
          />
          <button
            onClick={() => setTestValue('')}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Validation Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full bg-${getStatusColor()}-500`}></div>
          <span className={`text-sm font-medium text-${getStatusColor()}-700`}>
            {getStatusText()}
          </span>
        </div>
        <p className="text-xs text-gray-600">{getValidationSummary()}</p>
      </div>

      {/* Validation Errors */}
      {validationResult && !validationResult.isValid && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-red-700 mb-2">Validation Errors:</h5>
          <ul className="space-y-1">
            {validationResult.errors.map((error, index) => (
              <li key={index} className="text-xs text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advanced Details */}
      {showAdvanced && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          {/* Pattern Testing */}
          {validation.pattern && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Pattern Testing</h5>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-mono text-gray-600 mb-2">
                  Pattern: {validation.pattern}
                </div>
                <div className="text-xs text-gray-500">
                  {validationService.testPattern(validation.pattern, testValue) ? 
                    '✅ Pattern matches' : 
                    '❌ Pattern does not match'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Custom Validation */}
          {validation.customValidation && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Custom Validation</h5>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs font-mono text-gray-600 mb-2">
                  Function: {validation.customValidation}
                </div>
                <div className="text-xs text-gray-500">
                  {validationResult && validationResult.isValid ? 
                    '✅ Custom validation passed' : 
                    '❌ Custom validation failed'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Quick Test Values */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Quick Test Values</h5>
            <div className="flex flex-wrap gap-2">
              {getQuickTestValues(fieldType).map((testValue) => (
                <button
                  key={testValue}
                  onClick={() => setTestValue(testValue)}
                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded border border-blue-200 text-blue-700"
                >
                  {testValue}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get quick test values based on field type
function getQuickTestValues(fieldType) {
  switch (fieldType) {
    case 'email':
      return ['test@example.com', 'invalid-email', 'test@', '@example.com'];
    case 'phone':
      return ['+1234567890', '123-456-7890', 'invalid', '123'];
    case 'url':
      return ['https://example.com', 'http://test.com', 'invalid-url', 'example.com'];
    case 'number':
      return ['123', '0', '-5', 'invalid', '12.34'];
    case 'password':
      return ['Password123!', 'weak', '123456', 'password'];
    default:
      return ['test', '123', 'abc', ''];
  }
}
