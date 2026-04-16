import React, { useState, useEffect, useMemo } from 'react';

/**
 * CalculatedInput - Calculated field component
 * Executes JavaScript formulas based on other field values
 */
export default function CalculatedInput({
  field,
  value = '',
  onChange,
  disabled = false,
  error = null,
  formData = {}
}) {
  // Debug logging
  console.log('CalculatedInput props:', { field, value, onChange, disabled, error, formData });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('CalculatedInput: field prop is undefined or null');
    return (
      <div className="calculated-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [calculatedValue, setCalculatedValue] = useState(value);
  const [calculationError, setCalculationError] = useState(null);

  // Create a stable dependency for formData
  const formDataKey = useMemo(() => {
    if (!field.dependsOn || !Array.isArray(field.dependsOn)) return '';
    return field.dependsOn.map(dep => formData[dep]).join('|');
  }, [field.dependsOn, formData]);

  // Execute calculation when dependencies change
  useEffect(() => {
    if (field.formula && field.dependsOn) {
      try {
        const result = executeCalculation(field.formula, formData, field.dependsOn);
        setCalculatedValue(result);
        setCalculationError(null);
        
        // Update parent form if value changed
        if (result !== value) {
          onChange(result);
        }
      } catch (error) {
        setCalculationError(`Calculation error: ${error.message}`);
        setCalculatedValue('');
      }
    }
  }, [field.formula, field.dependsOn, formDataKey, value]); // Use stable formDataKey instead of formData

  const executeCalculation = (formula, formData, dependencies) => {
    // Security check - prevent dangerous operations
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
      if (pattern.test(formula)) {
        throw new Error('Dangerous operation detected');
      }
    }

    // Create safe calculation function
    const calculationFunction = new Function('formData', 'dependencies', `
      try {
        ${formula}
      } catch (error) {
        throw new Error('Calculation failed: ' + error.message);
      }
    `);

    return calculationFunction(formData, dependencies);
  };

  const getCalculationExamples = () => [
    {
      name: 'Sum of two numbers',
      formula: 'return (formData.field1 || 0) + (formData.field2 || 0);',
      description: 'Adds values from field1 and field2'
    },
    {
      name: 'Percentage calculation',
      formula: 'return ((formData.total || 0) / (formData.max || 1)) * 100;',
      description: 'Calculates percentage based on total and max values'
    },
    {
      name: 'Conditional calculation',
      formula: 'return formData.type === "premium" ? formData.basePrice * 1.5 : formData.basePrice;',
      description: 'Applies premium pricing based on type selection'
    },
    {
      name: 'Date difference',
      formula: 'return Math.floor((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24));',
      description: 'Calculates days between two dates'
    },
    {
      name: 'String concatenation',
      formula: 'return (formData.firstName || "") + " " + (formData.lastName || "");',
      description: 'Combines first and last names'
    }
  ];

  return (
    <div className="calculated-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={calculatedValue}
          readOnly
          disabled={disabled}
          className={`
            px-3 py-2 border rounded-md bg-gray-50
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-default'}
            ${error || calculationError ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Calculated value will appear here..."
        />
        
        <div className="text-sm text-gray-500">
          <span className="font-medium">Auto-calculated</span>
        </div>
      </div>
      
      {/* Formula Display */}
      {field.formula && (
        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">Formula:</div>
          <code className="text-xs text-blue-700 font-mono break-all">
            {field.formula}
          </code>
        </div>
      )}
      
      {/* Dependencies Display */}
      {field.dependsOn && field.dependsOn.length > 0 && (
        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
          <div className="text-xs font-medium text-green-800 mb-1">Depends on:</div>
          <div className="text-xs text-green-700">
            {field.dependsOn.join(', ')}
          </div>
        </div>
      )}
      
      {/* Calculation Examples */}
      {!field.formula && (
        <div className="mt-3 p-3 bg-gray-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">Calculation Examples:</div>
          <div className="space-y-2">
            {getCalculationExamples().map((example, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium text-gray-600">{example.name}</div>
                <div className="text-gray-500">{example.description}</div>
                <code className="text-xs text-blue-600 font-mono block mt-1">
                  {example.formula}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {calculationError && (
        <div className="mt-1 text-sm text-red-600">
          {calculationError}
        </div>
      )}
      
      {field.helpText && (
        <div className="mt-1 text-sm text-gray-500">
          {field.helpText}
        </div>
      )}
    </div>
  );
}
