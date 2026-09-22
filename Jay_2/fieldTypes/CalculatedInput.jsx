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
    const normalizedFormula = formula.includes('return')
      ? formula
      : `return (${formula});`;

    const calculationFunction = new Function('formData', 'dependencies', `
      try {
        ${normalizedFormula}
      } catch (error) {
        throw new Error('Calculation failed: ' + error.message);
      }
    `);

    return calculationFunction(formData, dependencies);
  };

  const displayValue = calculatedValue === '' || calculatedValue === null || calculatedValue === undefined
    ? ''
    : String(calculatedValue);

  return (
    <div className="calculated-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={displayValue}
          readOnly
          disabled={disabled}
          className={`
            px-3 py-2 border rounded-md bg-gray-50
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-default'}
            ${error || calculationError ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Calculated from the other answers"
        />
        
        <div className="text-sm text-gray-500">
          <span className="font-medium">Calculated</span>
        </div>
      </div>
      
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
