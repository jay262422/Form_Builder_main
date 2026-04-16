import React from 'react';

/**
 * Checkbox - Boolean input field
 */
export default function Checkbox({
  label,
  name,
  value = false,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  error = false,
  className = '',
  description,
  formTheme,
  theme,
  // Extract these props to prevent them from being passed to DOM
  validation,
  styling,
  helpText,
  defaultValue,
  // Additional custom props that should not be passed to DOM
  showWhen,
  calculateFrom,
  condition,
  dependsOn,
  dynamicMapping,
  optionType,
  inputType,
  getOptions,
  ...props
}) {
  const checkboxId = `checkbox-${name}`;
  
  return (
    <div className={`checkbox-field ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            type="checkbox"
            name={name}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className={`
              h-4 w-4 text-blue-600 border-gray-300 rounded
              focus:ring-blue-500 focus:ring-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-300 focus:ring-red-500' : ''}
            `}
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          {label && (
            <label 
              htmlFor={checkboxId}
              className="font-medium text-gray-700 cursor-pointer"
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {description && (
            <p className="text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}