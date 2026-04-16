import React, { useState } from 'react';

/**
 * RangeSlider - Range slider input field
 * Allows selecting a value within a range
 */
export default function RangeSlider({
  label,
  name,
  value = 50,
  onChange,
  onBlur,
  min = 0,
  max = 100,
  step = 1,
  required = false,
  disabled = false,
  error = false,
  className = '',
  formTheme = 'modern',
  theme,
  // Extract these props to prevent them from being passed to DOM
  validation,
  styling,
  helpText,
  defaultValue,
  ...props
}) {
  // Use validation object if provided, otherwise fall back to individual props
  const validationConfig = validation || {};
  const finalMin = validationConfig.min || min;
  const finalMax = validationConfig.max || max;
  const finalStep = validationConfig.step || step;
  const finalRequired = validationConfig.required !== undefined ? validationConfig.required : required;
  const [displayValue, setDisplayValue] = useState(value);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    setDisplayValue(newValue);
    onChange?.(newValue);
  };

  const themeConfig = theme || {
    colors: {
      text: 'text-gray-900',
      field: 'bg-white border border-gray-300 focus:border-blue-500'
    }
  };

  return (
    <div className={`range-field ${className}`}>
      {label && (
        <label 
          className={`block text-sm font-medium ${themeConfig.colors.text} mb-2`}
        >
          {label}
          {finalRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex items-center space-x-4">
        <input
          type="range"
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          min={finalMin}
          max={finalMax}
          step={finalStep}
          disabled={disabled}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${
            error ? 'border-red-500' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...props}
        />
        <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
          {displayValue}
        </span>
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {/* Help text */}
      {helpText && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
} 