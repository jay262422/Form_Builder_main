import React from 'react';

/**
 * TextArea - Multi-line text input field
 */
export default function TextArea({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error = false,
  className = '',
  rows = 4,
  maxLength,
  minLength,
  formTheme = 'modern',
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
  const textareaId = `textarea-${name}`;
  
  const themeConfig = theme || {
    colors: {
      text: 'text-gray-900',
      field: 'bg-white border border-gray-300 focus:border-blue-500'
    }
  };
  
  return (
    <div className={`textarea-field ${className}`}>
      {label && (
        <label 
          htmlFor={textareaId}
          className={`block text-sm font-medium ${themeConfig.colors.text} mb-1`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        minLength={minLength}
        className={`
          w-full px-3 py-2 rounded-md shadow-sm resize-vertical
          focus:outline-none focus:ring-2
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${themeConfig.colors.field}
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        {...props}
      />
      
      {maxLength && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {value.length}/{maxLength} characters
        </div>
      )}
      
      {/* Help text */}
      {helpText && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
} 