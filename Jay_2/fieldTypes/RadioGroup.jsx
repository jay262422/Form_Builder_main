import React from 'react';

/**
 * RadioGroup - Radio button group for single selection
 */
export default function RadioGroup({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  options = [],
  required = false,
  disabled = false,
  error = false,
  className = '',
  layout = 'vertical', // 'vertical' or 'horizontal'
  formTheme, // Extract formTheme to prevent it from being passed to DOM
  theme, // Extract theme to prevent it from being passed to DOM
  // Extract these props to prevent them from being passed to DOM
  validation,
  styling,
  helpText,
  defaultValue,
  ...props
}) {
  const groupId = `radio-${name}`;
  
  return (
    <div className={`radio-group-field ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={`space-y-2 ${layout === 'horizontal' ? 'flex flex-wrap gap-4' : ''}`}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`;
          const isChecked = value === option.value;
          
          return (
            <div key={option.value || index} className="flex items-center">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                required={required}
                disabled={disabled}
                className={`
                  h-4 w-4 text-blue-600 border-gray-300
                  focus:ring-blue-500 focus:ring-2
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${error ? 'border-red-300 focus:ring-red-500' : ''}
                `}
                {...props}
              />
              <label
                htmlFor={optionId}
                className={`
                  ml-2 text-sm text-gray-700 cursor-pointer
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                {option.label || option.value}
              </label>
            </div>
          );
        })}
      </div>
      
      {/* Help text */}
      {helpText && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
} 