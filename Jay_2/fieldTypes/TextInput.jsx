import React from 'react';

/**
 * TextInput - Standard text input field
 * Supports various input types: text, email, password, phone, number
 */
export default function TextInput({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error = false,
  className = '',
  minLength,
  maxLength,
  pattern,
  autoComplete,
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
  // Use validation object if provided, otherwise fall back to individual props
  const validationConfig = validation || {};
  const finalMinLength = validationConfig.minLength || minLength;
  const finalMaxLength = validationConfig.maxLength || maxLength;
  const finalPattern = validationConfig.pattern || pattern;
  const finalRequired = validationConfig.required !== undefined ? validationConfig.required : required;
  const htmlType = inputType || type;
  const inputId = `input-${name}`;
  
  const themeConfig = theme || {
    colors: {
      text: 'text-gray-900',
      field: 'bg-white border border-gray-300 focus:border-blue-500',
      label: 'text-gray-700 font-medium'
    }
  };

  // Get appropriate icon based on field type or name
  const getFieldIcon = () => {
    if (htmlType === 'email') return '📧';
    if (htmlType === 'tel' || type === 'phone') return '📞';
    // Remove icons for name fields to prevent overlapping with placeholder text
    // if (name?.includes('name')) return '👤';
    if (name?.includes('company')) return '🏢';
    if (name?.includes('address') || name?.includes('city') || name?.includes('state') || name?.includes('pincode') || name?.includes('area')) return '📍';
    if (name?.includes('msme') || name?.includes('gst')) return '✅';
    return null;
  };

  const fieldIcon = getFieldIcon();

  return (
    <div className={`text-input-field ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm ${themeConfig.colors.label} mb-2`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {fieldIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">{fieldIcon}</span>
          </div>
        )}
        <input
          id={inputId}
          type={htmlType}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={finalRequired}
          disabled={disabled}
          minLength={finalMinLength}
          maxLength={finalMaxLength}
          pattern={finalPattern}
          autoComplete={autoComplete}
          className={`
            w-full ${fieldIcon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-lg shadow-sm
            focus:outline-none transition-all duration-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${themeConfig.colors.field}
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          `}
          {...props}
        />
      </div>
      
      {/* Help text */}
      {helpText && (
        <p className="mt-1 text-sm text-gray-500 help-text">
          {helpText}
        </p>
      )}
    </div>
  );
} 